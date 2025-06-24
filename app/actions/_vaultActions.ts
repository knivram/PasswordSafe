"use server";

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
        // Create vault and VaultAccess with OWNER role in a transaction
        await prisma.$transaction(async tx => {
          const vault = await tx.vault.create({
            data: {
              name,
            },
          });

          await tx.vaultAccess.create({
            data: {
              vaultId: vault.id,
              userId: user.id,
              role: "OWNER",
              wrappedKey,
            },
          });
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
      // Get all vaults through VaultAccess
      const vaultAccesses = await prisma.vaultAccess.findMany({
        where: {
          userId: user.id,
        },
        include: {
          vault: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          vault: {
            updatedAt: "desc",
          },
        },
      });

      // Transform to expected format
      const allVaults = vaultAccesses.map(access => ({
        ...access.vault,
        wrappedKey: access.wrappedKey,
        isOwner: access.role === "OWNER",
        role: access.role,
        actualWrappedKey: access.wrappedKey,
      }));

      return allVaults;
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
  withVaultAccess(async ({ vault, vaultAccess }) => {
    return {
      ...vault,
      wrappedKey: vaultAccess.wrappedKey,
      isOwner: vaultAccess.role === "OWNER",
      role: vaultAccess.role,
    };
  })
);
