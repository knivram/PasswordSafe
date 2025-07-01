"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, MoreHorizontal, Edit, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useKeyStore } from "@/context/KeyStore";
import { SecretsClient } from "@/lib/secrets-client";
import type {
  SecretWithDecryptedData,
  SecretWithDecryptedDataAndVault,
} from "@/types/secret";
import type { VaultWithAccess } from "@/types/vault";
import { SecretFormDialog } from "./secret-form-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

const SECRETS_LIST_QUERY_KEY = "secrets-list";
const ALL_SECRETS_QUERY_KEY = "all-secrets-list";

interface SecretsListProps {
  vaultId: string;
  vault: VaultWithAccess;
}

type SecretWithOptionalVault =
  | SecretWithDecryptedData
  | SecretWithDecryptedDataAndVault;

interface SecretsListBaseProps {
  queryKey: string[];
  queryFn: (privateKey: CryptoKey) => Promise<SecretWithOptionalVault[]>;
  emptyStateMessage: {
    primary: string;
    secondary: string;
  };
  showVaultBadges?: boolean;
  checkPermissions?: boolean;
  vault?: {
    isOwner?: boolean;
    role?: string;
  };
  vaultId?: string;
}

const secretsClient = new SecretsClient();

function SecretsListBase({
  queryKey,
  queryFn,
  emptyStateMessage,
  showVaultBadges = false,
  checkPermissions = false,
  vault,
  vaultId,
}: SecretsListBaseProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isInitialized, privateKey } = useKeyStore();
  const [secret, setSecret] = useState<SecretWithOptionalVault | undefined>(
    undefined
  );
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );

  const { data: secrets, isLoading: isLoadingSecrets } = useQuery({
    queryKey,
    queryFn: async () => {
      if (privateKey) {
        return await queryFn(privateKey);
      }
      return [];
    },
    enabled: !!privateKey,
  });

  const togglePasswordVisibility = (secretId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(secretId)) {
        newSet.delete(secretId);
      } else {
        newSet.add(secretId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleVaultBadgeClick = (vaultId: string) => {
    router.push(`/app/${vaultId}`);
  };

  const canEditSecret = (_secret: SecretWithOptionalVault) => {
    return checkPermissions && (vault?.isOwner || vault?.role === "EDITOR");
  };

  const handleDeleteSecret = async (secret: SecretWithOptionalVault) => {
    try {
      await secretsClient.deleteSecret(secret.id);

      // Invalidate queries based on the type of list
      if (showVaultBadges) {
        // For all-secrets view, invalidate both all-secrets and specific vault queries
        await queryClient.invalidateQueries({
          queryKey: [ALL_SECRETS_QUERY_KEY],
        });
        await queryClient.invalidateQueries({
          queryKey: [SECRETS_LIST_QUERY_KEY, secret.vaultId],
        });
      } else {
        // For vault-specific view, invalidate vault and all-secrets queries
        await queryClient.invalidateQueries({
          queryKey: [SECRETS_LIST_QUERY_KEY, vaultId],
        });
        await queryClient.invalidateQueries({
          queryKey: [SECRETS_LIST_QUERY_KEY],
        });
      }

      toast.success("Secret deleted");
    } catch (error) {
      console.error("Failed to delete secret:", error);
      toast.error("Failed to delete secret. Please try again.");
    }
  };

  if (!isInitialized || isLoadingSecrets) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card className="gap-2" key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-48" />
                  {showVaultBadges && <Skeleton className="h-5 w-20" />}
                </div>
                {checkPermissions && <Skeleton className="h-8 w-8" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="border-t pt-2">
                <Skeleton className="h-3 w-64" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!secrets || secrets.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{emptyStateMessage.primary}</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {emptyStateMessage.secondary}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <SecretFormDialog
        vaultId={secret?.vaultId as string}
        secret={secret}
        isOpen={!!secret}
        onOpenChange={open => {
          if (!open) {
            setSecret(undefined);
          }
        }}
      />
      {secrets.map(secret => (
        <Card className="gap-2" key={secret.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{secret.title}</CardTitle>
                {showVaultBadges && "vault" in secret && (
                  <Badge
                    variant="secondary"
                    className="hover:bg-secondary/80 cursor-pointer"
                    onClick={() => handleVaultBadgeClick(secret.vaultId)}
                  >
                    {secret.vault.name}
                  </Badge>
                )}
              </div>
              {canEditSecret(secret) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSecret(secret);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteSecret(secret)}
                      variant="destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {secret.data.username && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Username</p>
                  <p className="text-muted-foreground text-sm">
                    {secret.data.username}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    secret.data.username &&
                    copyToClipboard(secret.data.username)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {secret.data.password && (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-muted-foreground font-mono text-sm">
                    {visiblePasswords.has(secret.id)
                      ? secret.data.password
                      : "••••••••"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePasswordVisibility(secret.id)}
                  >
                    {visiblePasswords.has(secret.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      secret.data.password &&
                      copyToClipboard(secret.data.password)
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {secret.data.url && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">URL</p>
                  <a
                    href={secret.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    {secret.data.url}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    secret.data.url && copyToClipboard(secret.data.url)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {secret.data.notes && (
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {secret.data.notes}
                </p>
              </div>
            )}

            <div className="border-t pt-2">
              <p className="text-muted-foreground text-xs">
                Created: {new Date(secret.createdAt).toLocaleDateString()}
                {secret.updatedAt !== secret.createdAt && (
                  <span>
                    {" "}
                    • Updated: {new Date(secret.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Wrapper component for vault-specific secrets list
function SecretsList({ vaultId, vault }: SecretsListProps) {
  return (
    <SecretsListBase
      queryKey={[SECRETS_LIST_QUERY_KEY, vaultId]}
      queryFn={privateKey =>
        secretsClient.getSecretsWithDecryptedData(vault, privateKey)
      }
      emptyStateMessage={{
        primary: "No secrets in this vault yet.",
        secondary: 'Click "Add Secret" to create your first secret.',
      }}
      showVaultBadges={false}
      checkPermissions
      vault={vault}
      vaultId={vaultId}
    />
  );
}

// Wrapper component for all secrets list
function AllSecretsList() {
  return (
    <SecretsListBase
      queryKey={[ALL_SECRETS_QUERY_KEY]}
      queryFn={privateKey =>
        secretsClient.getAllSecretsWithDecryptedData(privateKey)
      }
      emptyStateMessage={{
        primary: "No secrets found across your vaults.",
        secondary: "Create a vault and add some secrets to get started.",
      }}
      showVaultBadges
      checkPermissions={false}
    />
  );
}

export {
  SecretsList,
  AllSecretsList,
  SECRETS_LIST_QUERY_KEY,
  ALL_SECRETS_QUERY_KEY,
};
