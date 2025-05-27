"use server";

import { currentUser } from "@clerk/nextjs/server";
import type { Secret } from "@/generated/prisma";
import { AuthError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/uuid";

export interface CreateSecretServerInput {
  vaultId: string;
  title: string;
  encryptedData: string;
}

export interface UpdateSecretServerInput {
  title?: string;
  encryptedData?: string;
}

export async function createSecret({
  vaultId,
  title,
  encryptedData,
}: CreateSecretServerInput): Promise<Secret> {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

  // Validate UUID format
  if (!isValidUUID(vaultId)) {
    throw new AuthError("Invalid vault ID format.");
  }

  try {
    // Verify user owns the vault
    const vault = await prisma.vault.findFirst({
      where: {
        id: vaultId,
        userId: user.id,
      },
    });

    if (!vault) {
      throw new AuthError("Vault not found or access denied.");
    }

    // Create the secret with pre-encrypted data
    const secret = await prisma.secret.create({
      data: {
        vaultId,
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

export async function getSecrets(vaultId: string): Promise<Secret[]> {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

  // Validate UUID format
  if (!isValidUUID(vaultId)) {
    throw new AuthError("Invalid vault ID format.");
  }

  try {
    // Verify user owns the vault
    const vault = await prisma.vault.findFirst({
      where: {
        id: vaultId,
        userId: user.id,
      },
    });

    if (!vault) {
      throw new AuthError("Vault not found or access denied.");
    }

    // Get secrets for the vault
    const secrets = await prisma.secret.findMany({
      where: {
        vaultId,
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
}

export async function getSecret(secretId: string): Promise<Secret | null> {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

  // Validate UUID format
  if (!isValidUUID(secretId)) {
    return null;
  }

  try {
    // Get the secret and verify ownership through vault
    const secret = await prisma.secret.findFirst({
      where: {
        id: secretId,
        vault: {
          userId: user.id,
        },
      },
    });

    return secret;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Get secret error:", error);
    throw new AuthError("Failed to get secret. Please try again later.");
  }
}

export async function updateSecret({
  secretId,
  updates,
}: {
  secretId: string;
  updates: UpdateSecretServerInput;
}): Promise<Secret> {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

  // Validate UUID format
  if (!isValidUUID(secretId)) {
    throw new AuthError("Invalid secret ID format.");
  }

  try {
    // Get the secret and verify ownership through vault
    const secret = await prisma.secret.findFirst({
      where: {
        id: secretId,
        vault: {
          userId: user.id,
        },
      },
      include: {
        vault: true,
      },
    });

    if (!secret) {
      throw new AuthError("Secret not found or access denied.");
    }

    // Update the secret
    const updatedSecret = await prisma.secret.update({
      where: { id: secretId },
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

export async function deleteSecret(secretId: string): Promise<void> {
  const user = await currentUser();

  if (!user) {
    throw new AuthError("You are not signed in.");
  }

  // Validate UUID format
  if (!isValidUUID(secretId)) {
    throw new AuthError("Invalid secret ID format.");
  }

  try {
    // Verify user owns the secret through vault ownership
    const secret = await prisma.secret.findFirst({
      where: {
        id: secretId,
        vault: {
          userId: user.id,
        },
      },
    });

    if (!secret) {
      throw new AuthError("Secret not found or access denied.");
    }

    await prisma.secret.delete({
      where: { id: secretId },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Delete secret error:", error);
    throw new AuthError("Failed to delete secret. Please try again later.");
  }
}
