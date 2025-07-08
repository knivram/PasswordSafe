"use client";

import { FavoriteSecretsList } from "@/components/secrets-list";

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Favorite Secrets</h1>
      <FavoriteSecretsList />
    </div>
  );
}
