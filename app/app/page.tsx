"use client";

import { AllSecretsList } from "@/components/secrets-list";

export default function Page() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">All Secrets</h1>
      </div>

      <AllSecretsList />
    </div>
  );
}
