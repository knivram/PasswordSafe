"use server";

import type { Secret } from "@/generated/prisma";
import { withVaultAccess, withSecretAccess, withAuth } from "@/lib/auth";
import { AppError, ErrorCode, withErrorHandling } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const createSecret = withErrorHandling(
  withVaultAccess(
    async (
      ctx,
      input: { title: string; encryptedData: string }
    ): Promise<Secret> => {
      // Check if user has permission to create secrets (EDITOR or OWNER)
      if (!ctx.hasVaultPermission("EDITOR")) {
        throw new AppError(
          "You don't have permission to create secrets in this vault.",
          ErrorCode.FORBIDDEN
        );
      }

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
      // Check if user has permission to update secrets (EDITOR or OWNER)
      if (!ctx.hasVaultPermission("EDITOR")) {
        throw new AppError(
          "You don't have permission to update secrets in this vault.",
          ErrorCode.FORBIDDEN
        );
      }

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
    // Check if user has permission to delete secrets (EDITOR or OWNER)
    if (!ctx.hasVaultPermission("EDITOR")) {
      throw new AppError(
        "You don't have permission to delete secrets from this vault.",
        ErrorCode.FORBIDDEN
      );
    }

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

export interface SecretWithVault extends Secret {
  vault: {
    id: string;
    name: string;
    wrappedKey: string;
  };
}

export const getAllSecretsWithVaults = withErrorHandling(
  withAuth(
    async (
      ctx,
      filter: { isFavorite?: boolean } = {}
    ): Promise<SecretWithVault[]> => {
      try {
        // Get all secrets from vaults the user has access to, limited to latest 50
        const secrets = await prisma.secret.findMany({
          where: {
            ...(filter.isFavorite ? { isFavorite: true } : {}),
            vault: {
              vaultAccess: {
                some: {
                  userId: ctx.user.id,
                },
              },
            },
          },
          include: {
            vault: {
              select: {
                id: true,
                name: true,
                vaultAccess: {
                  where: {
                    userId: ctx.user.id,
                  },
                  select: {
                    wrappedKey: true,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        });

        // Transform the data to match our expected interface
        return secrets.map(secret => ({
          id: secret.id,
          vaultId: secret.vaultId,
          title: secret.title,
          encryptedData: secret.encryptedData,
          isFavorite: secret.isFavorite,
          createdAt: secret.createdAt,
          updatedAt: secret.updatedAt,
          vault: {
            id: secret.vault.id,
            name: secret.vault.name,
            wrappedKey: secret.vault.vaultAccess[0].wrappedKey,
          },
        }));
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        console.error("Get all secrets error:", error);
        throw new AppError(
          "Failed to get secrets. Please try again later.",
          ErrorCode.DATABASE_ERROR
        );
      }
    }
  )
);

export const toggleSecretFavorite = withErrorHandling(
  withSecretAccess(async (ctx): Promise<{ isFavorite: boolean }> => {
    try {
      const updatedSecret = await prisma.secret.update({
        where: {
          id: ctx.secret.id,
        },
        data: {
          isFavorite: !ctx.secret.isFavorite,
        },
        select: {
          isFavorite: true,
        },
      });

      return { isFavorite: updatedSecret.isFavorite };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Toggle favorite error:", error);
      throw new AppError(
        "Failed to toggle favorite. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);

// Re-export getAllSecretsWithVaults with isFavorite filter for backward compatibility
export const getFavoriteSecretsWithVaults = withErrorHandling(
  withAuth(async (ctx): Promise<SecretWithVault[]> => {
    try {
      // Call the same query but with isFavorite filter
      const secrets = await prisma.secret.findMany({
        where: {
          isFavorite: true,
          vault: {
            vaultAccess: {
              some: {
                userId: ctx.user.id,
              },
            },
          },
        },
        include: {
          vault: {
            select: {
              id: true,
              name: true,
              vaultAccess: {
                where: {
                  userId: ctx.user.id,
                },
                select: {
                  wrappedKey: true,
                },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transform the data to match our expected interface
      return secrets.map(secret => ({
        id: secret.id,
        vaultId: secret.vaultId,
        title: secret.title,
        encryptedData: secret.encryptedData,
        isFavorite: secret.isFavorite,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
        vault: {
          id: secret.vault.id,
          name: secret.vault.name,
          wrappedKey: secret.vault.vaultAccess[0].wrappedKey,
        },
      }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Get favorite secrets error:", error);
      throw new AppError(
        "Failed to get favorite secrets. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);

export const toggleSecretFavorite = withErrorHandling(
  withSecretAccess(async (ctx): Promise<{ isFavorite: boolean }> => {
    
    try {
      const updatedSecret = await prisma.secret.update({
        where: {
          id: ctx.secret.id,
        },
        data: {
          isFavorite: !ctx.secret.isFavorite,
        },
        select: {
          isFavorite: true,
        },
      });

      return { isFavorite: updatedSecret.isFavorite };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Toggle favorite error:", error);
      throw new AppError(
        "Failed to toggle favorite. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);

export const getFavoriteSecretsWithVaults = withErrorHandling(
  withAuth(async (ctx): Promise<SecretWithVault[]> => {
    try {
      // Get all favorite secrets from vaults the user has access to
      const secrets = await prisma.secret.findMany({
        where: {
          isFavorite: true,
          vault: {
            vaultAccess: {
              some: {
                userId: ctx.user.id,
              },
            },
          },
        },
        include: {
          vault: {
            select: {
              id: true,
              name: true,
              vaultAccess: {
                where: {
                  userId: ctx.user.id,
                },
                select: {
                  wrappedKey: true,
                },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      // Transform the data to match our expected interface
      return secrets.map(secret => ({
        id: secret.id,
        vaultId: secret.vaultId,
        title: secret.title,
        encryptedData: secret.encryptedData,
        isFavorite: secret.isFavorite,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
        vault: {
          id: secret.vault.id,
          name: secret.vault.name,
          wrappedKey: secret.vault.vaultAccess[0].wrappedKey,
        },
      }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Get favorite secrets error:", error);
      throw new AppError(
        "Failed to get favorite secrets. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);
