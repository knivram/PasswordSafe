"use client";

import {
  createSecret,
  getSecrets,
  getSecretsByVaults,
  getSecret,
  updateSecret,
  deleteSecret,
  type UpdateSecretServerInput,
} from "@/app/actions/_secretActions";
import type { Secret } from "@/generated/prisma";
import { handleActionResponse, isErrorResponse } from "@/lib/query-utils";
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
      // Only encrypt the secret data, not the metadata
      const dataString = JSON.stringify(input.data);
      const encryptedData = await this.cryptoService.encryptSecret({
        secret: dataString,
        publicKey,
      });

      const response = await createSecret({
        vaultId: input.vaultId,
        title: input.title,
        encryptedData,
        isFavorite: input.isFavorite ?? false,
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
      const encryptedSecrets = await this.getSecrets(vaultId);
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
            isFavorite: secret.isFavorite ?? false,
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
        isFavorite: encryptedSecret.isFavorite ?? false,
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

    // Handle unencrypted fields
    if (updatedSecret.title) {
      serverUpdates.title = updatedSecret.title;
    }
    if (typeof updatedSecret.isFavorite === "boolean") {
      serverUpdates.isFavorite = updatedSecret.isFavorite;
    }

    try {
      // Only encrypt the secret data if it's being updated
      if (updatedSecret.data) {
        const dataString = JSON.stringify(updatedSecret.data);
        const encryptedData = await this.cryptoService.encryptSecret({
          secret: dataString,
          publicKey,
        });
        serverUpdates.encryptedData = encryptedData;
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

  async getFavoriteSecrets(
    privateKey: CryptoKey
  ): Promise<SecretWithDecryptedData[]> {
    try {
      const response = await getSecretsByVaults();
      const secrets = handleActionResponse(response);

      // Decrypt each secret's data
      const decryptedSecrets = await Promise.all(
        secrets.map(async secret => {
          const decryptedData = await this.cryptoService.decryptSecret({
            encryptedSecret: secret.encryptedData,
            privateKey,
          });

          return {
            ...secret,
            data: JSON.parse(decryptedData) as SecretData,
          };
        })
      );

      return decryptedSecrets;
    } catch (error) {
      console.error("Failed to get favorite secrets:", error);
      throw new Error("Failed to get favorite secrets. Please try again.");
    }
  }
}
