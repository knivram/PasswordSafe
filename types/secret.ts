// Encrypted data
export interface SecretData {
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  customFields?: Record<string, string>;
}

// Input for creating a new secret
export interface CreateSecretInput {
  vaultId: string;
  title: string;
  data: SecretData;
  isFavorite?: boolean;
}

// Input for updating a secret
export interface UpdateSecretInput {
  title?: string;
  data?: SecretData;
  isFavorite?: boolean;
}

// Decrypted secret with metadata
export interface SecretWithDecryptedData {
  id: string;
  vaultId: string;
  title: string;
  data: SecretData;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}
