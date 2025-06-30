import { Lock, Plus } from "lucide-react";
import { getVault } from "@/app/actions/_vaultActions";
import { SecretFormDialog } from "@/components/secret-form-dialog";
import { SecretsList } from "@/components/secrets-list";
import { Button } from "@/components/ui/button";
import { isErrorResponse } from "@/lib/query-utils";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const vaultId = (await params).vaultId;

  // Handle special routes
  if (vaultId === "favorites") {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Favorite Secrets</h1>
        </div>
        <SecretsList vaultId="favorites" />
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold">{vault.name}</h1>
        <SecretFormDialog
          vaultId={vaultId}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Secret
            </Button>
          }
        />
      </div>
      <SecretsList vaultId={vaultId} />
    </div>
  );
}
