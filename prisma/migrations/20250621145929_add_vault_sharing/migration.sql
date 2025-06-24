-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "VaultAccess" (
    "id" UUID NOT NULL,
    "vaultId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AccessRole" NOT NULL,
    "wrappedKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VaultAccess_userId_idx" ON "VaultAccess"("userId");

-- CreateIndex
CREATE INDEX "VaultAccess_vaultId_idx" ON "VaultAccess"("vaultId");

-- CreateIndex
CREATE UNIQUE INDEX "VaultAccess_vaultId_userId_key" ON "VaultAccess"("vaultId", "userId");

-- AddForeignKey
ALTER TABLE "VaultAccess" ADD CONSTRAINT "VaultAccess_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultAccess" ADD CONSTRAINT "VaultAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing vault owners to VaultAccess table
INSERT INTO "VaultAccess" ("id", "vaultId", "userId", "role", "wrappedKey", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    "id" as "vaultId",
    "userId",
    'OWNER'::"AccessRole" as "role",
    "wrappedKey",
    "createdAt",
    "updatedAt"
FROM "Vault"
WHERE "userId" IS NOT NULL AND "wrappedKey" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Vault" DROP CONSTRAINT "Vault_userId_fkey";

-- AlterTable
ALTER TABLE "Vault" DROP COLUMN "userId",
DROP COLUMN "wrappedKey";
