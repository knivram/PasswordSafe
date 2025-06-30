"use server";

import type { Secret } from "@/generated/prisma";
import { withVaultAccess, withSecretAccess, withAuth } from "@/lib/auth";
import { AppError, ErrorCode, withErrorHandling } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const createSecret = withErrorHandling(
  withVaultAccess(
    async (
      ctx,
      input: { title: string; encryptedData: string; isFavorite?: boolean }
    ): Promise<Secret> => {
      const { title, encryptedData, isFavorite } = input;

      try {
        // Create the secret with pre-encrypted data
        const secret = await prisma.secret.create({
          data: {
            vaultId: ctx.vault.id,
            title,
            encryptedData,
            isFavorite: isFavorite ?? false,
          },
        });

        return secret;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        console.error("Create secret error:", error);
        throw new AppError(
          "Failed to create secret. Please try again later.",
          ErrorCode.DATABASE_ERROR
        );
      }
    }
  )
);

export const getSecrets = withErrorHandling(
  withVaultAccess(async (ctx): Promise<Secret[]> => {
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
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Get secrets error:", error);
      throw new AppError(
        "Failed to get secrets. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);

export const getSecret = withErrorHandling(
  withSecretAccess(async (ctx): Promise<Secret> => {
    return ctx.secret;
  })
);

export interface UpdateSecretServerInput {
  title?: string;
  encryptedData?: string;
  isFavorite?: boolean;
}

export const updateSecret = withErrorHandling(
  withSecretAccess(
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
        if (error instanceof AppError) {
          throw error;
        }
        console.error("Update secret error:", error);
        throw new AppError(
          "Failed to update secret. Please try again later.",
          ErrorCode.DATABASE_ERROR
        );
      }
    }
  )
);

export const deleteSecret = withErrorHandling(
  withSecretAccess(async (ctx): Promise<void> => {
    try {
      await prisma.secret.delete({
        where: { id: ctx.secret.id },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Delete secret error:", error);
      throw new AppError(
        "Failed to delete secret. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);

export const getSecretsByVaults = withErrorHandling(
  withAuth(async ({ user }): Promise<Secret[]> => {
    try {
      // Get all favorite secrets across all vaults the user has access to
      const secrets = await prisma.secret.findMany({
        where: {
          vault: {
            userId: user.id,
          },
          isFavorite: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return secrets;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Get secrets error:", error);
      throw new AppError(
        "Failed to get secrets. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);
