"use server";

import type { Vault } from "@/generated/prisma";
import { withAuth, withVaultAccess } from "@/lib/auth";
import { AppError, ErrorCode, withErrorHandling } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const createVault = withErrorHandling(
  withAuth(
    async (
      { user },
      {
        name,
        wrappedKey,
      }: {
        name: string;
        wrappedKey: string;
      }
    ) => {
      try {
        await prisma.vault.create({
          data: {
            name,
            wrappedKey,
            userId: user.id,
          },
        });
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        console.error("Create vault error:", error);
        throw new AppError(
          "Failed to create vault. Please try again later.",
          ErrorCode.DATABASE_ERROR
        );
      }
    }
  )
);

export const getVaults = withErrorHandling(
  withAuth(async ({ user }) => {
    try {
      const vaults = await prisma.vault.findMany({
        where: {
          userId: user.id,
        },
      });
      return vaults;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Get vaults error:", error);
      throw new AppError(
        "Failed to get vaults. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);

export const getVault = withErrorHandling(
  withVaultAccess(async ({ vault }): Promise<Vault> => {
    return vault;
  })
);
