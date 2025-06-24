"use server";

import type { AccessRole } from "@/generated/prisma";
import { withAuth, withVaultOwnership } from "@/lib/auth";
import { AppError, ErrorCode, withErrorHandling } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/uuid";

export const shareVault = withErrorHandling(
  withVaultOwnership(
    async (
      { user, vault },
      {
        targetUserEmail,
        role,
        wrappedKey,
      }: {
        targetUserEmail: string;
        role: AccessRole;
        wrappedKey: string;
      }
    ) => {
      try {
        // Find the target user by email
        const targetUser = await prisma.user.findUnique({
          where: { email: targetUserEmail },
        });

        if (!targetUser) {
          throw new AppError(
            "User not found with that email address.",
            ErrorCode.NOT_FOUND
          );
        }

        if (targetUser.id === user.id) {
          throw new AppError(
            "You cannot share a vault with yourself.",
            ErrorCode.VALIDATION_ERROR
          );
        }

        // Check if user already has access to this vault
        const existingAccess = await prisma.vaultAccess.findUnique({
          where: {
            vaultId_userId: {
              vaultId: vault.id,
              userId: targetUser.id,
            },
          },
        });

        if (existingAccess) {
          throw new AppError(
            "User already has access to this vault.",
            ErrorCode.VALIDATION_ERROR
          );
        }

        // Create vault access record
        await prisma.vaultAccess.create({
          data: {
            vaultId: vault.id,
            userId: targetUser.id,
            role,
            wrappedKey,
          },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        console.error("Share vault error:", error);
        throw new AppError(
          "Failed to share vault. Please try again later.",
          ErrorCode.DATABASE_ERROR
        );
      }
    }
  )
);

export const revokeVaultAccess = withErrorHandling(
  withVaultOwnership(
    async ({ vault }, { targetUserId }: { targetUserId: string }) => {
      try {
        if (!isValidUUID(targetUserId)) {
          throw new AppError("Invalid user ID format.", ErrorCode.INVALID_UUID);
        }

        const deletedAccess = await prisma.vaultAccess.deleteMany({
          where: {
            vaultId: vault.id,
            userId: targetUserId,
          },
        });

        if (deletedAccess.count === 0) {
          throw new AppError(
            "User does not have access to this vault.",
            ErrorCode.NOT_FOUND
          );
        }

        return { success: true };
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        console.error("Revoke vault access error:", error);
        throw new AppError(
          "Failed to revoke access. Please try again later.",
          ErrorCode.DATABASE_ERROR
        );
      }
    }
  )
);

export const updateVaultAccess = withErrorHandling(
  withVaultOwnership(
    async (
      { vault, vaultAccess: _vaultAccess },
      {
        targetUserId,
        role,
      }: {
        targetUserId: string;
        role: AccessRole;
      }
    ) => {
      try {
        const existingAccess = await prisma.vaultAccess.findUnique({
          where: {
            vaultId_userId: {
              vaultId: vault.id,
              userId: targetUserId,
            },
          },
        });

        if (!existingAccess) {
          throw new AppError(
            "User does not have access to this vault.",
            ErrorCode.NOT_FOUND
          );
        }

        await prisma.vaultAccess.update({
          where: {
            vaultId_userId: {
              vaultId: vault.id,
              userId: targetUserId,
            },
          },
          data: {
            role,
          },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        console.error("Update vault access error:", error);
        throw new AppError(
          "Failed to update access. Please try again later.",
          ErrorCode.DATABASE_ERROR
        );
      }
    }
  )
);

export const getVaultSharedUsers = withErrorHandling(
  withVaultOwnership(async ({ vault, vaultAccess: _vaultAccess }) => {
    try {
      const sharedUsers = await prisma.vaultAccess.findMany({
        where: {
          vaultId: vault.id,
          role: {
            not: "OWNER",
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return sharedUsers.map(access => ({
        id: access.id,
        userId: access.user.id,
        email: access.user.email,
        role: access.role,
        createdAt: access.createdAt,
      }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Get vault shared users error:", error);
      throw new AppError(
        "Failed to get shared users. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);

export const searchUsers = withErrorHandling(
  withAuth(async ({ user }, { email }: { email: string }) => {
    try {
      if (!email || email.length < 3) {
        return [];
      }

      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: email,
            mode: "insensitive",
          },
          id: {
            not: user.id, // Exclude current user
          },
        },
        select: {
          id: true,
          email: true,
          publicKey: true,
        },
        take: 10,
      });

      return users;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Search users error:", error);
      throw new AppError(
        "Failed to search users. Please try again later.",
        ErrorCode.DATABASE_ERROR
      );
    }
  })
);
