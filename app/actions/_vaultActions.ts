"use server";

import { Vault } from "@/generated/prisma";
import { AuthError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function createVault({
  name,
  wrappedKey,
}: {
  name: string;
  wrappedKey: string;
}) {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

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

export async function getVaults(): Promise<Vault[]> {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

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
}
