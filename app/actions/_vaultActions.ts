"use server";

import type { Vault } from "@/generated/prisma";
import { withAuth } from "@/lib/auth";
import { AuthError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/uuid";

export const createVault = withAuth(
  async (
    user,
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
      if (error instanceof AuthError) {
        throw error;
      }
      console.error("Create vault error:", error);
      throw new AuthError("Failed to create vault. Please try again later.");
    }
  }
);

export const getVaults = withAuth(async user => {
  try {
    const vaults = await prisma.vault.findMany({
      where: {
        userId: user.id,
      },
    });
    return vaults;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Get vaults error:", error);
    throw new AuthError("Failed to get vaults. Please try again later.");
  }
});

export const getVault = withAuth(
  async (user, vaultId: string): Promise<Vault | null> => {
    // Validate UUID format before querying database
    if (!isValidUUID(vaultId)) {
      return null;
    }

    const vault = await prisma.vault.findUnique({
      where: {
        id: vaultId,
        userId: user.id,
      },
    });

    return vault;
  }
);
