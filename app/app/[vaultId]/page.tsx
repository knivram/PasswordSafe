import { AddSecretDialog } from "@/components/add-secret-dialog";
import { SecretsList } from "@/components/secrets-list";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const vaultId = (await params).vaultId;
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vault {vaultId}</h1>
        <AddSecretDialog vaultId={vaultId} />
      </div>
      <SecretsList vaultId={vaultId} />
    </div>
  );
}
