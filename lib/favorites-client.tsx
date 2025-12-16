"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useKeyStore } from "@/context/KeyStore";
import { SecretsClient } from "@/lib/secrets-client";
import type { SecretWithDecryptedDataAndVault } from "@/types/secret";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const secretsClient = new SecretsClient();
const FAVORITES_QUERY_KEY = "favorites";

export function useFavorites() {
  const queryClient = useQueryClient();
  const { privateKey } = useKeyStore();

  const { data: favorites, isLoading } = useQuery({
    queryKey: [FAVORITES_QUERY_KEY],
    queryFn: async () => {
      if (!privateKey) return [];
      return await secretsClient.getAllSecretsWithDecryptedData(privateKey, { isFavorite: true });
    },
    enabled: !!privateKey,
  });

  const toggleFavorite = async (secretId: string, isFavorite: boolean) => {
    try {
      await secretsClient.toggleFavorite(secretId);

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: [FAVORITES_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: ["secrets-list"] });
      await queryClient.invalidateQueries({ queryKey: ["all-secrets-list"] });

      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };

  return {
    favorites: favorites || [],
    isLoading,
    toggleFavorite,
  };
}

export function FavoriteButton({
  secretId,
  isFavorite,
  size = "default"
}: {
  secretId: string;
  isFavorite: boolean;
  size?: "sm" | "default";
}) {
  const { toggleFavorite } = useFavorites();

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => toggleFavorite(secretId, isFavorite)}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className="hover:bg-transparent"
    >
      <Star
        className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} ${
          isFavorite ? "fill-yellow-400 text-yellow-400" : ""
        }`}
      />
    </Button>
  );
}

export function FavoritesEmptyState() {
  return (
    <div className="py-12 text-center">
      <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-20" />
      <p className="text-muted-foreground">No favorite secrets yet</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Mark secrets as favorites to see them here
      </p>
    </div>
  );
}

export function FavoritesQuickAccess() {
  const { favorites, isLoading, toggleFavorite } = useFavorites();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favorite Secrets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favorite Secrets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No favorites yet. Mark secrets as favorites for quick access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          Favorite Secrets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {favorites.slice(0, 5).map((secret) => (
            <li key={secret.id} className="flex items-center justify-between">
              <div className="truncate">
                <span className="font-medium">{secret.title}</span>
                {" "}
                <span className="text-xs text-muted-foreground">
                  ({secret.vault.name})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(secret.id, true)}
                title="Remove from favorites"
              >
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
