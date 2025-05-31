import type { User } from "@clerk/backend";
import { currentUser } from "@clerk/nextjs/server";
import type { Secret, Vault } from "@/generated/prisma";
import { AuthError, ErrorCode, ValidationError, NotFoundError } from "./errors";
import { prisma } from "./prisma";
import { isValidUUID } from "./uuid";

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) {
    throw new AuthError("You are not signed in.", ErrorCode.UNAUTHORIZED);
  }
  return user;
}

export async function requireVaultAccess(
  vaultId: string
): Promise<{ user: User; vault: Vault }> {
  const user = await requireUser();

  if (!isValidUUID(vaultId)) {
    throw new ValidationError(
      "Invalid vault ID format.",
      ErrorCode.INVALID_UUID
    );
  }

  const vault = await prisma.vault.findFirst({
    where: {
      id: vaultId,
      userId: user.id,
    },
  });

  if (!vault) {
    throw new NotFoundError("Vault not found or access denied.");
  }

  return { user, vault };
}

export async function requireSecretAccess(
  secretId: string
): Promise<{ user: User; secret: Secret }> {
  const user = await requireUser();

  if (!isValidUUID(secretId)) {
    throw new ValidationError(
      "Invalid secret ID format.",
      ErrorCode.INVALID_UUID
    );
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
    throw new NotFoundError("Secret not found or access denied.");
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
