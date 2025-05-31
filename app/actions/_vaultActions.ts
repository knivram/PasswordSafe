"use server";

import type { Vault } from "@/generated/prisma";
import { withAuth, withVaultAccess } from "@/lib/auth";
import { AuthError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const createVault = withAuth(
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
      if (error instanceof AuthError) {
        throw error;
      }
      console.error("Create vault error:", error);
      throw new AuthError("Failed to create vault. Please try again later.");
    }
  }
);

export const getVaults = withAuth(async ({ user }) => {
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

export const getVault = withVaultAccess(async ({ vault }): Promise<Vault> => {
  return vault;
});
