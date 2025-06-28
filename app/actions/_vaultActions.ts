"use server";

import { AccessRole } from "@/generated/prisma";
import { withAuth, withVaultAccess, withVaultOwnership } from "@/lib/auth";
import { AppError, ErrorCode, withErrorHandling } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { VaultWithAccess } from "@/types/vault";

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
  withAuth(async ({ user }): Promise<VaultWithAccess[]> => {
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
              _count: {
                select: {
                  vaultAccess: true,
                },
              },
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
      const allVaults: VaultWithAccess[] = vaultAccesses.map(access => ({
        ...access.vault,
        wrappedKey: access.wrappedKey,
        isOwner: access.role === AccessRole.OWNER,
        role: access.role,
        userCount: access.vault._count.vaultAccess,
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
  withVaultAccess(async ({ vault, vaultAccess }): Promise<VaultWithAccess> => {
    // Get the user count for this vault
    const userCount = await prisma.vaultAccess.count({
      where: {
        vaultId: vault.id,
      },
    });

    return {
      ...vault,
      wrappedKey: vaultAccess.wrappedKey,
      isOwner: vaultAccess.role === AccessRole.OWNER,
      role: vaultAccess.role,
      userCount,
    };
  })
);

export const updateVault = withErrorHandling(
  withVaultOwnership(async ({ vault }, { name }: { name: string }) => {
    try {
      await prisma.vault.updateMany({
        where: {
          id: vault.id,
        },
        data: {
          name,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Update vault error:", error);
      throw new AppError(
        "Failed to update vault. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);

export const deleteVault = withErrorHandling(
  withVaultOwnership(async ({ vault }) => {
    try {
      await prisma.vault.deleteMany({
        where: {
          id: vault.id,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Delete vault error:", error);
      throw new AppError(
        "Failed to delete vault. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);
