"use client";

import {
  createSecret,
  getSecrets,
  getSecret,
  updateSecret,
  deleteSecret,
  type UpdateSecretServerInput,
} from "@/app/actions/_secretActions";
import type { Secret } from "@/generated/prisma";
import type {
  SecretData,
  CreateSecretInput,
  UpdateSecretInput,
  SecretWithDecryptedData,
} from "@/types/secret";
import { CryptoService } from "./crypto";

export class SecretsClient {
  private cryptoService: CryptoService;

  constructor() {
    this.cryptoService = new CryptoService();
  }

  async createSecret(
    input: CreateSecretInput,
    publicKey: CryptoKey
  ): Promise<Secret> {
    try {
      const dataString = JSON.stringify(input.data);
      const encryptedData = await this.cryptoService.encryptSecret({
        secret: dataString,
        publicKey,
      });

      return await createSecret({
        vaultId: input.vaultId,
        title: input.title,
        encryptedData,
      });
    } catch (error) {
      console.error("Failed to create secret:", error);
      throw new Error("Failed to create secret. Please try again.");
    }
  }

  async getSecrets(vaultId: string): Promise<Secret[]> {
    return await getSecrets({ vaultId });
  }

  async getSecret(secretId: string): Promise<Secret | null> {
    return await getSecret({ secretId });
  }

  async getSecretsWithDecryptedData(
    vaultId: string,
    privateKey: CryptoKey
  ): Promise<SecretWithDecryptedData[]> {
    try {
      const encryptedSecrets = await getSecrets({ vaultId });

      const decryptedSecrets: SecretWithDecryptedData[] = [];

      for (const secret of encryptedSecrets) {
        try {
          const decryptedDataString = await this.cryptoService.decryptSecret({
            encryptedSecret: secret.encryptedData,
            privateKey,
          });

          const data: SecretData = JSON.parse(decryptedDataString);

          decryptedSecrets.push({
            id: secret.id,
            vaultId: secret.vaultId,
            title: secret.title,
            data,
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
      const encryptedSecret = await getSecret({ secretId });

      if (!encryptedSecret) {
        return null;
      }

      const decryptedDataString = await this.cryptoService.decryptSecret({
        encryptedSecret: encryptedSecret.encryptedData,
        privateKey,
      });

      const data: SecretData = JSON.parse(decryptedDataString);

      return {
        id: encryptedSecret.id,
        vaultId: encryptedSecret.vaultId,
        title: encryptedSecret.title,
        data,
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
    publicKey: CryptoKey
  ): Promise<Secret> {
    const serverUpdates: UpdateSecretServerInput = {};
    if (updatedSecret.title) {
      serverUpdates.title = updatedSecret.title;
    }

    try {
      if (updatedSecret.data) {
        const dataString = JSON.stringify(updatedSecret.data);
        // Encrypt the new data
        const encryptedData = await this.cryptoService.encryptSecret({
          secret: dataString,
          publicKey,
        });
        serverUpdates.encryptedData = encryptedData;
      }

      return await updateSecret({
        secretId,
        updates: serverUpdates,
      });
    } catch (error) {
      console.error("Failed to update secret:", error);
      throw new Error("Failed to update secret. Please try again.");
    }
  }

  async deleteSecret(secretId: string): Promise<void> {
    return await deleteSecret({ secretId });
  }
}
