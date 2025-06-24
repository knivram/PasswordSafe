import type { User } from "@clerk/backend";
import { currentUser } from "@clerk/nextjs/server";
import type {
  AccessRole,
  Secret,
  Vault,
  VaultAccess,
} from "@/generated/prisma";
import {
  AuthError,
  ErrorCode,
  ValidationError,
  NotFoundError,
  AppError,
} from "./errors";
import { prisma } from "./prisma";
import { isValidUUID } from "./uuid";

type VaultAccessContext = {
  user: User;
  vault: Vault;
  vaultAccess: VaultAccess;
  hasVaultPermission: (requiredRole: AccessRole) => boolean;
};

type SecretAccessContext = {
  user: User;
  secret: Secret;
  vaultAccess: VaultAccess;
  hasVaultPermission: (requiredRole: AccessRole) => boolean;
};

function hasVaultPermission(
  access: VaultAccess,
  user: User,
  requiredRole: AccessRole
): boolean {
  // Permission hierarchy: OWNER > EDITOR > VIEWER
  const roleHierarchy = {
    OWNER: 3,
    EDITOR: 2,
    VIEWER: 1,
  } as const;

  // eslint-disable-next-line security/detect-object-injection
  return roleHierarchy[access.role] >= roleHierarchy[requiredRole];
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) {
    throw new AuthError("You are not signed in.", ErrorCode.UNAUTHORIZED);
  }
  return user;
}

export async function requireVaultAccess(
  vaultId: string
): Promise<VaultAccessContext> {
  const user = await requireUser();

  if (!isValidUUID(vaultId)) {
    throw new ValidationError(
      "Invalid vault ID format.",
      ErrorCode.INVALID_UUID
    );
  }

  // All access now goes through VaultAccess table
  const vaultAccess = await prisma.vaultAccess.findFirst({
    where: {
      vaultId,
      userId: user.id,
    },
    include: {
      vault: true,
    },
  });

  if (!vaultAccess) {
    throw new NotFoundError("Vault not found or access denied.");
  }

  return {
    user,
    vault: vaultAccess.vault,
    vaultAccess,
    hasVaultPermission: (requiredRole: AccessRole) =>
      hasVaultPermission(vaultAccess, user, requiredRole),
  };
}

export async function requireSecretAccess(
  secretId: string
): Promise<SecretAccessContext> {
  const user = await requireUser();

  if (!isValidUUID(secretId)) {
    throw new ValidationError(
      "Invalid secret ID format.",
      ErrorCode.INVALID_UUID
    );
  }

  // Find secret through VaultAccess
  const secretWithAccess = await prisma.secret.findFirst({
    where: {
      id: secretId,
      vault: {
        vaultAccess: {
          some: {
            userId: user.id,
          },
        },
      },
    },
    include: {
      vault: {
        include: {
          vaultAccess: {
            where: {
              userId: user.id,
            },
          },
        },
      },
    },
  });

  if (!secretWithAccess || secretWithAccess.vault.vaultAccess.length === 0) {
    throw new NotFoundError("Secret not found or access denied.");
  }

  return {
    user,
    secret: secretWithAccess,
    vaultAccess: secretWithAccess.vault.vaultAccess[0],
    hasVaultPermission: (requiredRole: AccessRole) =>
      hasVaultPermission(
        secretWithAccess.vault.vaultAccess[0],
        user,
        requiredRole
      ),
  };
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
  fn: (context: VaultAccessContext, input: T) => Promise<R> | R
): (input: { vaultId: string } & T) => Promise<R> {
  return async (input: { vaultId: string } & T) => {
    const context = await requireVaultAccess(input.vaultId);
    return fn(context, input);
  };
}

export function withVaultOwnership<T extends object, R>(
  fn: (context: VaultAccessContext, input: T) => Promise<R> | R
): (input: { vaultId: string } & T) => Promise<R> {
  return async (input: { vaultId: string } & T) => {
    const context = await requireVaultAccess(input.vaultId);

    if (!context.hasVaultPermission("OWNER")) {
      throw new AppError(
        "You don't have permission to manage this vault.",
        ErrorCode.FORBIDDEN
      );
    }

    return fn(context, input);
  };
}

export function withSecretAccess<T extends object, R>(
  fn: (context: SecretAccessContext, input: T) => Promise<R> | R
): (input: { secretId: string } & T) => Promise<R> {
  return async (input: { secretId: string } & T) => {
    const context = await requireSecretAccess(input.secretId);
    return fn(context, input);
  };
}
