"use server";

import type { Secret } from "@/generated/prisma";
import { withAuth, withVaultAccess, withSecretAccess } from "@/lib/auth";
import { AuthError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/uuid";

export interface CreateSecretServerInput {
  vaultId: string;
  title: string;
  encryptedData: string;
}

export interface UpdateSecretServerInput {
  title?: string;
  encryptedData?: string;
}

export const createSecret = withVaultAccess(
  async (_ctx, input: CreateSecretServerInput): Promise<Secret> => {
    const { vaultId, title, encryptedData } = input;

    try {
      // Create the secret with pre-encrypted data
      const secret = await prisma.secret.create({
        data: {
          vaultId,
          title,
          encryptedData,
        },
      });

      return secret;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error("Create secret error:", error);
      throw new AuthError("Failed to create secret. Please try again later.");
    }
  }
);

export const getSecrets = withVaultAccess(
  async (_ctx, vaultId: string): Promise<Secret[]> => {
    try {
      // Get secrets for the vault
      const secrets = await prisma.secret.findMany({
        where: {
          vaultId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return secrets;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error("Get secrets error:", error);
      throw new AuthError("Failed to get secrets. Please try again later.");
    }
  }
);

export const getSecret = withAuth(
  async (user, secretId: string): Promise<Secret | null> => {
    // Validate UUID format
    if (!isValidUUID(secretId)) {
      return null;
    }

    try {
      // Get the secret and verify ownership through vault
      const secret = await prisma.secret.findFirst({
        where: {
          id: secretId,
          vault: {
            userId: user.id,
          },
        },
      });

      return secret;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error("Get secret error:", error);
      throw new AuthError("Failed to get secret. Please try again later.");
    }
  }
);

export const updateSecret = withSecretAccess(
  async (
    _ctx,
    {
      secretId,
      updates,
    }: {
      secretId: string;
      updates: UpdateSecretServerInput;
    }
  ): Promise<Secret> => {
    try {
      // Update the secret
      const updatedSecret = await prisma.secret.update({
        where: { id: secretId },
        data: updates,
      });

      return updatedSecret;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error("Update secret error:", error);
      throw new AuthError("Failed to update secret. Please try again later.");
    }
  }
);

export const deleteSecret = withSecretAccess(
  async (_ctx, secretId: string): Promise<void> => {
    try {
      await prisma.secret.delete({
        where: { id: secretId },
      });
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error("Delete secret error:", error);
      throw new AuthError("Failed to delete secret. Please try again later.");
    }
  }
);
