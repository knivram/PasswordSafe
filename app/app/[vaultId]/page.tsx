import { Lock, Plus } from "lucide-react";
import { getVault } from "@/app/actions/_vaultActions";
import { SecretFormDialog } from "@/components/secret-form-dialog";
import { SecretsList } from "@/components/secrets-list";
import { Button } from "@/components/ui/button";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const vaultId = (await params).vaultId;
  const vault = await getVault(vaultId);

  if (!vault) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-6">
        <div className="bg-muted rounded-full p-4">
          <Lock className="text-muted-foreground h-12 w-12" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-foreground text-xl font-semibold">
            Vault Not Found
          </h2>
          <p className="text-muted-foreground">
            The vault you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
        </div>
      </div>
    );
  }

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
