import type { AccessRole } from "@/generated/prisma";

export interface VaultWithAccess {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  wrappedKey: string;
  isOwner: boolean;
  role: AccessRole;
  userCount: number;
}

export interface CreateVaultInput {
  name: string;
  wrappedKey: string;
}

export interface UpdateVaultInput {
  name?: string;
}
