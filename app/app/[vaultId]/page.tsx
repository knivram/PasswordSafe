export default async function VaultPage({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const vaultId = (await params).vaultId;
  return (
    <div>
      <h1>Vault {vaultId}</h1>
    </div>
  );
}
