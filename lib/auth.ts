import type { User } from "@clerk/backend";
import { currentUser } from "@clerk/nextjs/server";
import type { Secret, Vault } from "@/generated/prisma";
import { AuthError } from "./errors";
import { prisma } from "./prisma";
import { isValidUUID } from "./uuid";

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) {
    throw new AuthError("You are not signed in.");
  }
  return user;
}

export async function requireVaultAccess(
  vaultId: string
): Promise<{ user: User; vault: Vault }> {
  const user = await requireUser();

  if (!isValidUUID(vaultId)) {
    throw new AuthError("Invalid vault ID format.");
  }

  const vault = await prisma.vault.findFirst({
    where: {
      id: vaultId,
      userId: user.id,
    },
  });

  if (!vault) {
    throw new AuthError("Vault not found or access denied.");
  }

  return { user, vault };
}

export async function requireSecretAccess(
  secretId: string
): Promise<{ user: User; secret: Secret }> {
  const user = await requireUser();

  if (!isValidUUID(secretId)) {
    throw new AuthError("Invalid secret ID format.");
  }

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

  return { user, secret };
}

export function withAuth<A extends unknown[], R>(
  fn: (context: { user: User }, ...args: A) => Promise<R> | R
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    const user = await requireUser();
    return fn({ user }, ...args);
  };
}

export function withVaultAccess<T extends object, R>(
  fn: (context: { user: User; vault: Vault }, input: T) => Promise<R> | R
): (input: { vaultId: string } & T) => Promise<R> {
  return async (input: { vaultId: string } & T) => {
    const context = await requireVaultAccess(input.vaultId);
    return fn(context, input);
  };
}

export function withSecretAccess<T extends object, R>(
  fn: (context: { user: User; secret: Secret }, input: T) => Promise<R> | R
): (input: { secretId: string } & T) => Promise<R> {
  return async (input: { secretId: string } & T) => {
    const context = await requireSecretAccess(input.secretId);
    return fn(context, input);
  };
}
