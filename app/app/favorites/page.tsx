"use client";

import { FavoriteSecretsList } from "@/components/secrets-list";

export default function FavoritesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Favorite Secrets</h1>
        <p className="text-muted-foreground mt-1">
          Your starred secrets from all vaults
        </p>
      </div>

      <FavoriteSecretsList />
    </div>
  );
}
