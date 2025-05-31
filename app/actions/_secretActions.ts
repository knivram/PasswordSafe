"use server";

import type { Secret } from "@/generated/prisma";
import { withVaultAccess, withSecretAccess } from "@/lib/auth";
import { AuthError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const createSecret = withVaultAccess(
  async (
    ctx,
    input: { title: string; encryptedData: string }
  ): Promise<Secret> => {
    const { title, encryptedData } = input;

    try {
      // Create the secret with pre-encrypted data
      const secret = await prisma.secret.create({
        data: {
          vaultId: ctx.vault.id,
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

export const getSecrets = withVaultAccess(async (ctx): Promise<Secret[]> => {
  try {
    // Get secrets for the vault
    const secrets = await prisma.secret.findMany({
      where: {
        vaultId: ctx.vault.id,
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
});

export const getSecret = withSecretAccess(async (ctx): Promise<Secret> => {
  return ctx.secret;
});

export interface UpdateSecretServerInput {
  title?: string;
  encryptedData?: string;
}

export const updateSecret = withSecretAccess(
  async (
    ctx,
    {
      updates,
    }: {
      updates: UpdateSecretServerInput;
    }
  ): Promise<Secret> => {
    try {
      // Update the secret
      const updatedSecret = await prisma.secret.update({
        where: { id: ctx.secret.id },
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

export const deleteSecret = withSecretAccess(async (ctx): Promise<void> => {
  try {
    await prisma.secret.delete({
      where: { id: ctx.secret.id },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Delete secret error:", error);
    throw new AuthError("Failed to delete secret. Please try again later.");
  }
});
