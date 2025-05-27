-- CreateTable
CREATE TABLE "Secret" (
    "id" UUID NOT NULL,
    "vaultId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Secret_vaultId_idx" ON "Secret"("vaultId");

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE CASCADE ON UPDATE CASCADE;
