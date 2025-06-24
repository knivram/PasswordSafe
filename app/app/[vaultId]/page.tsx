import { Lock, Plus, Share } from "lucide-react";
import { getVault } from "@/app/actions/_vaultActions";
import { SecretFormDialog } from "@/components/secret-form-dialog";
import { SecretsList } from "@/components/secrets-list";
import { Button } from "@/components/ui/button";
import { VaultSharingDialog } from "@/components/vault-sharing-dialog";
import { AccessRole } from "@/generated/prisma";
import { isErrorResponse } from "@/lib/query-utils";
import { getRoleDisplayName } from "@/lib/utils";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const vaultId = (await params).vaultId;
  const response = await getVault({ vaultId });

  // Handle error responses
  if (isErrorResponse(response)) {
    const { error } = response;
    console.error(`[${error.code}] Failed to load vault: ${error.message}`);

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-6">
        <div className="bg-muted rounded-full p-4">
          <Lock className="text-muted-foreground h-12 w-12" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-foreground text-xl font-semibold">
            {error.code === "NOT_FOUND"
              ? "Vault Not Found"
              : "Error Loading Vault"}
          </h2>
          <p className="text-muted-foreground">
            {error.code === "NOT_FOUND"
              ? "The vault you're looking for doesn't exist or you don't have access to it."
              : "Unable to load vault. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  const vault = response.data;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{vault.name}</h1>
          {!vault.isOwner && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {getRoleDisplayName(vault.role)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {vault.isOwner && (
            <VaultSharingDialog
              vaultId={vaultId}
              vaultName={vault.name}
              wrappedKey={vault.wrappedKey}
              trigger={
                <Button variant="outline">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              }
            />
          )}
          {(vault.isOwner || vault.role === AccessRole.EDITOR) && (
            <SecretFormDialog
              vaultId={vaultId}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Secret
                </Button>
              }
            />
          )}
        </div>
      </div>

      {vault.role === "VIEWER" && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            You have view-only access to this vault. You can see all secrets but
            cannot add, edit, or delete them.
          </p>
        </div>
      )}

      <SecretsList vaultId={vaultId} vault={vault} />
    </div>
  );
}
