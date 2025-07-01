export class CryptoService {
  public async onboarding(password: string): Promise<{
    publicKey: string;
    wrappedPrivateKey: string;
    salt: string;
    wrappedDefaultVaultKey: string;
  }> {
    const { publicKey, privateKey } = await this.generateKeyPair();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const kek = await this.deriveKek(password, salt);
    const wrappedPrivateKey = await this.wrapPrivateKey(privateKey, kek);
    const publicKeyBuffer = await crypto.subtle.exportKey("spki", publicKey);
    const { wrappedKey: wrappedDefaultVaultKey } =
      await this.generateAndWrapVaultKey(publicKey);

    return {
      publicKey: BufferTransformer.arrayBufferToBase64(publicKeyBuffer),
      wrappedPrivateKey:
        BufferTransformer.arrayBufferToBase64(wrappedPrivateKey),
      salt: BufferTransformer.arrayBufferToBase64(salt.buffer),
      wrappedDefaultVaultKey,
    };
  }

  public async importPublicPrivateKey({
    publicKeyBase64,
    wrappedPrivateKeyBase64,
    password,
    salt,
  }: {
    publicKeyBase64: string;
    wrappedPrivateKeyBase64: string;
    password: string;
    salt: string;
  }): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
    const publicKey = await crypto.subtle.importKey(
      "spki",
      BufferTransformer.base64ToArrayBuffer(publicKeyBase64),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt", "wrapKey"]
    );
    const privateKey = await this.decryptPrivateKey(
      wrappedPrivateKeyBase64,
      password,
      salt
    );
    return { publicKey, privateKey };
  }

  public async generateAndWrapVaultKey(
    publicKey: CryptoKey
  ): Promise<{ key: CryptoKey; wrappedKey: string }> {
    const key = await this.generateAESKey();
    const vaultKey = await this.wrapAESKey(key, publicKey);
    return {
      key,
      wrappedKey: BufferTransformer.arrayBufferToBase64(vaultKey),
    };
  }

  public async encryptSecret({
    secret,
    vaultKey,
  }: {
    secret: string;
    vaultKey: CryptoKey;
  }): Promise<string> {
    const data = new TextEncoder().encode(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      vaultKey,
      data
    );
    const packed = this.pack(iv, encrypted);
    return BufferTransformer.arrayBufferToBase64(packed);
  }

  public async decryptSecret({
    encryptedSecret,
    vaultKey,
  }: {
    encryptedSecret: string;
    vaultKey: CryptoKey;
  }): Promise<string> {
    const data = BufferTransformer.base64ToArrayBuffer(encryptedSecret);
    const { iv, data: encryptedData } = this.unpack(data);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      vaultKey,
      encryptedData
    );
    return new TextDecoder().decode(decrypted);
  }

  public async unwrapVaultKey({
    wrappedKey,
    privateKey,
  }: {
    wrappedKey: string;
    privateKey: CryptoKey;
  }): Promise<CryptoKey> {
    const wrappedKeyBuffer = BufferTransformer.base64ToArrayBuffer(wrappedKey);
    return crypto.subtle.unwrapKey(
      "raw",
      wrappedKeyBuffer,
      privateKey,
      { name: "RSA-OAEP" },
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  public async rewrapVaultKeyForUser({
    wrappedKey,
    ownerPrivateKey,
    targetUserPublicKey,
  }: {
    wrappedKey: string;
    ownerPrivateKey: CryptoKey;
    targetUserPublicKey: CryptoKey;
  }): Promise<string> {
    const vaultKey = await this.unwrapVaultKey({
      wrappedKey,
      privateKey: ownerPrivateKey,
    });

    const newWrappedKey = await this.wrapAESKey(vaultKey, targetUserPublicKey);
    return BufferTransformer.arrayBufferToBase64(newWrappedKey);
  }

  public async importPublicKeyFromBase64(
    publicKeyBase64: string
  ): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "spki",
      BufferTransformer.base64ToArrayBuffer(publicKeyBase64),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt", "wrapKey"]
    );
  }

  private async decryptPrivateKey(
    wrappedPrivateKey: string,
    password: string,
    salt: string
  ): Promise<CryptoKey> {
    const wrappedPrivateKeyBuffer =
      BufferTransformer.base64ToArrayBuffer(wrappedPrivateKey);
    const saltBuffer = BufferTransformer.base64ToUnit8Array(salt);
    return this.unwrapPrivateKey(wrappedPrivateKeyBuffer, password, saltBuffer);
  }

  private async generateAESKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  private async wrapAESKey(
    key: CryptoKey,
    pub: CryptoKey
  ): Promise<ArrayBuffer> {
    return crypto.subtle.wrapKey("raw", key, pub, { name: "RSA-OAEP" });
  }

  private async generateKeyPair(): Promise<{
    publicKey: CryptoKey;
    privateKey: CryptoKey;
  }> {
    return crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt", "wrapKey"]
    );
  }

  private async deriveKek(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const base = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100_000,
        hash: "SHA-256",
      },
      base,
      { name: "AES-GCM", length: 256 },
      true,
      ["wrapKey", "unwrapKey"]
    );
  }

  private async wrapPrivateKey(
    priv: CryptoKey,
    kek: CryptoKey
  ): Promise<ArrayBuffer> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const wrapped = await crypto.subtle.wrapKey("pkcs8", priv, kek, {
      name: "AES-GCM",
      iv,
    });
    return this.pack(iv, wrapped);
  }

  private async unwrapPrivateKey(
    wrappedPriv: ArrayBuffer,
    password: string,
    saltArr: Uint8Array
  ): Promise<CryptoKey> {
    const { iv, data } = this.unpack(wrappedPriv);

    const kek = await this.deriveKek(password, saltArr);

    const privateKey = await crypto.subtle.unwrapKey(
      "pkcs8",
      data,
      kek,
      { name: "AES-GCM", iv },
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt", "unwrapKey"]
    );

    return privateKey;
  }

  private pack(
    iv: Uint8Array,
    data: ArrayBuffer | ArrayBufferView
  ): ArrayBuffer {
    const dataBytes = ArrayBuffer.isView(data)
      ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
      : new Uint8Array(data);
    const out = new Uint8Array(iv.byteLength + dataBytes.byteLength);
    out.set(iv, 0);
    out.set(dataBytes, iv.byteLength);
    return out.buffer;
  }

  private unpack(src: ArrayBuffer | ArrayBufferView): {
    iv: Uint8Array;
    data: Uint8Array;
  } {
    const bytes = ArrayBuffer.isView(src)
      ? new Uint8Array(src.buffer, src.byteOffset, src.byteLength)
      : new Uint8Array(src);
    const iv = bytes.subarray(0, 12);
    const data = bytes.subarray(12);
    return { iv, data };
  }
}

const BufferTransformer = {
  base64ToArrayBuffer: (base64: string): ArrayBuffer => {
    return BufferTransformer.base64ToUnit8Array(base64).buffer as ArrayBuffer;
  },
  base64ToUnit8Array: (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  },
  arrayBufferToBase64: (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    return BufferTransformer.unit8ArrayToBase64(bytes);
  },
  unit8ArrayToBase64: (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      // eslint-disable-next-line security/detect-object-injection
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },
};
