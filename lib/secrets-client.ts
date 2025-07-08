"use client";

import {
  createSecret,
  getSecrets,
  getSecret,
  updateSecret,
  deleteSecret,
  getAllSecretsWithVaults,
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
import type { VaultWithAccess } from "@/types/vault";
import { cryptoService } from "./crypto";

export class SecretsClient {
  async createSecret(
    input: CreateSecretInput,
    privateKey: CryptoKey
  ): Promise<Secret> {
    try {
      // Get vault to access the wrapped vault key
      const vaultResponse = await getVault({ vaultId: input.vaultId });
      const vault = handleActionResponse(vaultResponse);

      // Unwrap the vault key
      const vaultKey = await cryptoService.unwrapVaultKey({
        wrappedKey: vault.wrappedKey,
        privateKey,
      });

      // Encrypt the secret data with the vault key
      const dataString = JSON.stringify(input.data);
      const encryptedData = await cryptoService.encryptSecret({
        secret: dataString,
        vaultKey,
      });

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
    vault: VaultWithAccess,
    privateKey: CryptoKey
  ): Promise<SecretWithDecryptedData[]> {
    try {
      const vaultKey = await cryptoService.unwrapVaultKey({
        wrappedKey: vault.wrappedKey,
        privateKey,
      });

      const encryptedSecrets = await this.getSecrets(vault.id);
      const decryptedSecrets: SecretWithDecryptedData[] = [];

      for (const secret of encryptedSecrets) {
        try {
          const decryptedDataString = await cryptoService.decryptSecret({
            encryptedSecret: secret.encryptedData,
            vaultKey,
          });
          const secretData: SecretData = JSON.parse(decryptedDataString);

          decryptedSecrets.push({
            id: secret.id,
            vaultId: secret.vaultId,
            title: secret.title,
            data: secretData,
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
        const vaultKey = await cryptoService.unwrapVaultKey({
          wrappedKey: vault.wrappedKey,
          privateKey,
        });

        // Encrypt the new data with the vault key
        const dataString = JSON.stringify(updatedSecret.data);
        serverUpdates.encryptedData = await cryptoService.encryptSecret({
          secret: dataString,
          vaultKey,
        });
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
    privateKey: CryptoKey
  ): Promise<SecretWithDecryptedDataAndVault[]> {
    const vaultKeys = new Map<string, CryptoKey>();
    try {
      const response = await getAllSecretsWithVaults();
      const secretsWithVaults = handleActionResponse(response);

      const decryptedSecrets: SecretWithDecryptedDataAndVault[] = [];

      for (const secretWithVault of secretsWithVaults) {
        try {
          let vaultKey: CryptoKey | undefined = vaultKeys.get(
            secretWithVault.vault.id
          );
          if (!vaultKey) {
            vaultKey = await cryptoService.unwrapVaultKey({
              wrappedKey: secretWithVault.vault.wrappedKey,
              privateKey,
            });
            vaultKeys.set(secretWithVault.vault.id, vaultKey);
          }

          const decryptedDataString = await cryptoService.decryptSecret({
            encryptedSecret: secretWithVault.encryptedData,
            vaultKey,
          });
          const secretData: SecretData = JSON.parse(decryptedDataString);

          decryptedSecrets.push({
            id: secretWithVault.id,
            vaultId: secretWithVault.vaultId,
            title: secretWithVault.title,
            data: secretData,
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
}
