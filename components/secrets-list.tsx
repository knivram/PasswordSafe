"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useKeyStore } from "@/context/KeyStore";
import { SecretsClient } from "@/lib/secrets-client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

export const SECRETS_LIST_QUERY_KEY = "secrets-list";

interface SecretsListProps {
  vaultId: string;
}

const secretsClient = new SecretsClient();

export function SecretsList({ vaultId }: SecretsListProps) {
  const { isInitialized, privateKey } = useKeyStore();
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );

  const { data: secrets, isLoading: isLoadingSecrets } = useQuery({
    queryKey: [SECRETS_LIST_QUERY_KEY, vaultId],
    queryFn: async () => {
      if (privateKey) {
        return await secretsClient.getSecretsWithDecryptedData(
          vaultId,
          privateKey
        );
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

  if (!isInitialized || isLoadingSecrets) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card className="gap-2" key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-8" />
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
        <p className="text-muted-foreground">No secrets in this vault yet.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Click &quot;Add Secret&quot; to create your first secret.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {secrets.map(secret => (
        <Card className="gap-2" key={secret.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{secret.title}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      // TODO: Implement edit functionality
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      // TODO: Implement delete functionality
                    }}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
