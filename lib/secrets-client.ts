"use client";

import {
  createSecret,
  getSecrets,
  getSecret,
  updateSecret,
  deleteSecret,
  getAllSecretsWithVaults,
  getFavoriteSecretsWithVaults,
  toggleSecretFavorite,
  type UpdateSecretServerInput,
} from "@/app/actions/_secretActions";
import { getVault } from "@/app/actions/_vaultActions";
import type { Secret } from "@/generated/prisma";
import { handleActionResponse, isErrorResponse } from "@/lib/query-utils";
import type {
  SecretData,
  CreateSecretInput,
  UpdateSecretInput,
  SecretWithDecryptedData,
  SecretWithDecryptedDataAndVault,
} from "@/types/secret";
import { cryptoService } from "./crypto";

export class SecretsClient {
  private cryptoService = cryptoService;

  async createSecret(
    input: CreateSecretInput,
    privateKey: CryptoKey
  ): Promise<Secret> {
    try {
      // Get vault to access the wrapped vault key
      const vaultResponse = await getVault({ vaultId: input.vaultId });
      const vault = handleActionResponse(vaultResponse);

      // Unwrap the vault key
      const vaultKey = await this.cryptoService.unwrapVaultKey({
        wrappedKey: vault.wrappedKey,
        privateKey,
      });

      // Encrypt the secret data with the vault key
      const dataString = JSON.stringify(input.data);
      const data = new TextEncoder().encode(dataString);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        vaultKey,
        data
      );

      // Pack IV and encrypted data
      const packedData = this.pack(iv, encrypted);
      const encryptedData = this.arrayBufferToBase64(packedData);

      const response = await createSecret({
        vaultId: input.vaultId,
        title: input.title,
        encryptedData,
      });

      return handleActionResponse(response);
    } catch (error) {
      console.error("Failed to create secret:", error);
      throw new Error("Failed to create secret. Please try again.");
    }
  }

  async getSecrets(vaultId: string): Promise<Secret[]> {
    const response = await getSecrets({ vaultId });
    return handleActionResponse(response);
  }

  async getSecret(secretId: string): Promise<Secret | null> {
    const response = await getSecret({ secretId });

    if (isErrorResponse(response)) {
      // For getSecret, we want to return null if not found rather than throwing
      if (response.error.code === "NOT_FOUND") {
        return null;
      }
      // For other errors, we still want to throw
      throw new Error(response.error.message);
    }

    return response.data;
  }

  async getSecretsWithDecryptedData(
    vaultId: string,
    privateKey: CryptoKey
  ): Promise<SecretWithDecryptedData[]> {
    try {
      // Get vault to access the wrapped vault key
      const vaultResponse = await getVault({ vaultId });
      const vault = handleActionResponse(vaultResponse);

      // Unwrap the vault key
      const vaultKey = await this.cryptoService.unwrapVaultKey({
        wrappedKey: vault.wrappedKey,
        privateKey,
      });

      const encryptedSecrets = await this.getSecrets(vaultId);
      const decryptedSecrets: SecretWithDecryptedData[] = [];

      for (const secret of encryptedSecrets) {
        try {
          // Decrypt with vault key
          const encryptedData = this.base64ToArrayBuffer(secret.encryptedData);
          const { iv, data } = this.unpack(encryptedData);

          const decrypted = await crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv,
            },
            vaultKey,
            data
          );

          const decryptedDataString = new TextDecoder().decode(decrypted);
          const secretData: SecretData = JSON.parse(decryptedDataString);

          decryptedSecrets.push({
            id: secret.id,
            vaultId: secret.vaultId,
            title: secret.title,
            data: secretData,
            isFavorite: secret.isFavorite,
            createdAt: secret.createdAt,
            updatedAt: secret.updatedAt,
          });
        } catch (decryptError) {
          console.error(`Failed to decrypt secret ${secret.id}:`, decryptError);
          continue;
        }
      }

      return decryptedSecrets;
    } catch (error) {
      console.error("Failed to get secrets with decrypted data:", error);
      throw new Error(
        "Failed to decrypt secrets. Please check your password and try again."
      );
    }
  }

  async getSecretWithDecryptedData(
    secretId: string,
    privateKey: CryptoKey
  ): Promise<SecretWithDecryptedData | null> {
    try {
      const encryptedSecret = await this.getSecret(secretId);

      if (!encryptedSecret) {
        return null;
      }

      // Get vault to access the wrapped vault key
      const vaultResponse = await getVault({
        vaultId: encryptedSecret.vaultId,
      });
      const vault = handleActionResponse(vaultResponse);

      // Unwrap the vault key
      const vaultKey = await this.cryptoService.unwrapVaultKey({
        wrappedKey: vault.wrappedKey,
        privateKey,
      });

      // Decrypt with vault key
      const encryptedData = this.base64ToArrayBuffer(
        encryptedSecret.encryptedData
      );
      const { iv, data } = this.unpack(encryptedData);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        vaultKey,
        data
      );

      const decryptedDataString = new TextDecoder().decode(decrypted);
      const secretData: SecretData = JSON.parse(decryptedDataString);

      return {
        id: encryptedSecret.id,
        vaultId: encryptedSecret.vaultId,
        title: encryptedSecret.title,
        data: secretData,
        isFavorite: encryptedSecret.isFavorite,
        createdAt: encryptedSecret.createdAt,
        updatedAt: encryptedSecret.updatedAt,
      };
    } catch (error) {
      console.error("Failed to get secret with decrypted data:", error);
      throw new Error(
        "Failed to decrypt secret. Please check your password and try again."
      );
    }
  }

  async updateSecret(
    secretId: string,
    updatedSecret: UpdateSecretInput,
    privateKey: CryptoKey
  ): Promise<Secret> {
    const serverUpdates: UpdateSecretServerInput = {};
    if (updatedSecret.title) {
      serverUpdates.title = updatedSecret.title;
    }

    try {
      if (updatedSecret.data) {
        // Get the existing secret to get vault ID
        const existingSecret = await this.getSecret(secretId);
        if (!existingSecret) {
          throw new Error("Secret not found");
        }

        // Get vault to access the wrapped vault key
        const vaultResponse = await getVault({
          vaultId: existingSecret.vaultId,
        });
        const vault = handleActionResponse(vaultResponse);

        // Unwrap the vault key
        const vaultKey = await this.cryptoService.unwrapVaultKey({
          wrappedKey: vault.wrappedKey,
          privateKey,
        });

        // Encrypt the new data with the vault key
        const dataString = JSON.stringify(updatedSecret.data);
        const data = new TextEncoder().encode(dataString);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv,
          },
          vaultKey,
          data
        );

        // Pack IV and encrypted data
        const packedData = this.pack(iv, encrypted);
        serverUpdates.encryptedData = this.arrayBufferToBase64(packedData);
      }

      const response = await updateSecret({
        secretId,
        updates: serverUpdates,
      });

      return handleActionResponse(response);
    } catch (error) {
      console.error("Failed to update secret:", error);
      throw new Error("Failed to update secret. Please try again.");
    }
  }

  async deleteSecret(secretId: string): Promise<void> {
    const response = await deleteSecret({ secretId });
    handleActionResponse(response);
  }

  async getAllSecretsWithDecryptedData(
    privateKey: CryptoKey,
    filter: { isFavorite?: boolean } = {}
  ): Promise<SecretWithDecryptedDataAndVault[]> {
    const vaultKeys = new Map<string, CryptoKey>();
    try {
      // If we're filtering for favorites, use the dedicated endpoint
      const response = filter.isFavorite
        ? await getFavoriteSecretsWithVaults()
        : await getAllSecretsWithVaults();
      const secretsWithVaults = handleActionResponse(response);

      const decryptedSecrets: SecretWithDecryptedDataAndVault[] = [];

      for (const secretWithVault of secretsWithVaults) {
        try {
          let vaultKey: CryptoKey | undefined = vaultKeys.get(
            secretWithVault.vault.id
          );
          if (!vaultKey) {
            vaultKey = await this.cryptoService.unwrapVaultKey({
              wrappedKey: secretWithVault.vault.wrappedKey,
              privateKey,
            });
            if (vaultKey) {
              vaultKeys.set(secretWithVault.vault.id, vaultKey);
            } else {
              throw new Error(
                `Failed to unwrap vault key for ${secretWithVault.vault.id}`
              );
            }
          }

          const encryptedData = this.base64ToArrayBuffer(
            secretWithVault.encryptedData
          );
          const { iv, data } = this.unpack(encryptedData);

          const decrypted = await crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv,
            },
            vaultKey,
            data
          );

          const decryptedDataString = new TextDecoder().decode(decrypted);
          const secretData: SecretData = JSON.parse(decryptedDataString);

          decryptedSecrets.push({
            id: secretWithVault.id,
            vaultId: secretWithVault.vaultId,
            title: secretWithVault.title,
            data: secretData,
            isFavorite: secretWithVault.isFavorite,
            createdAt: secretWithVault.createdAt,
            updatedAt: secretWithVault.updatedAt,
            vault: {
              id: secretWithVault.vault.id,
              name: secretWithVault.vault.name,
            },
          });
        } catch (decryptError) {
          console.error(
            `Failed to decrypt secret ${secretWithVault.id}:`,
            decryptError
          );
          continue;
        }
      }

      return decryptedSecrets;
    } catch (error) {
      console.error("Failed to get all secrets with decrypted data:", error);
      throw new Error(
        "Failed to decrypt secrets. Please check your password and try again."
      );
    }
  }

  async toggleFavorite(secretId: string): Promise<{ isFavorite: boolean }> {
    try {
      const response = await toggleSecretFavorite({ secretId });
      return handleActionResponse(response);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw new Error("Failed to toggle favorite. Please try again.");
    }
  }

  async getFavoriteSecretsWithDecryptedData(
    privateKey: CryptoKey
  ): Promise<SecretWithDecryptedDataAndVault[]> {
    try {
      const response = await getFavoriteSecretsWithVaults();
      const secretsWithVaults = handleActionResponse(response);
      const vaultKeys = new Map<string, CryptoKey>();
      const decryptedSecrets: SecretWithDecryptedDataAndVault[] = [];

      for (const secretWithVault of secretsWithVaults) {
        try {
          let vaultKey: CryptoKey | undefined = vaultKeys.get(
            secretWithVault.vault.id
          );
          if (!vaultKey) {
            vaultKey = await this.cryptoService.unwrapVaultKey({
              wrappedKey: secretWithVault.vault.wrappedKey,
              privateKey,
            });
            vaultKeys.set(secretWithVault.vault.id, vaultKey);
          }

          const encryptedData = this.base64ToArrayBuffer(
            secretWithVault.encryptedData
          );
          const { iv, data } = this.unpack(encryptedData);

          const decrypted = await crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv,
            },
            vaultKey,
            data
          );

          const decryptedDataString = new TextDecoder().decode(decrypted);
          const secretData: SecretData = JSON.parse(decryptedDataString);

          decryptedSecrets.push({
            id: secretWithVault.id,
            vaultId: secretWithVault.vaultId,
            title: secretWithVault.title,
            data: secretData,
            isFavorite: secretWithVault.isFavorite,
            createdAt: secretWithVault.createdAt,
            updatedAt: secretWithVault.updatedAt,
            vault: {
              id: secretWithVault.vault.id,
              name: secretWithVault.vault.name,
            },
          });
        } catch (decryptError) {
          console.error(
            `Failed to decrypt favorite secret ${secretWithVault.id}:`,
            decryptError
          );
          continue;
        }
      }

      return decryptedSecrets;
    } catch (error) {
      console.error(
        "Failed to get favorite secrets with decrypted data:",
        error
      );
      throw new Error(
        "Failed to decrypt favorite secrets. Please check your password and try again."
      );
    }
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

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      // eslint-disable-next-line security/detect-object-injection
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
