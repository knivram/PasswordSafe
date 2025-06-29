export interface SecretData {
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  customFields?: Record<string, string>;
}

export interface CreateSecretInput {
  vaultId: string;
  title: string;
  data: SecretData;
}

export interface UpdateSecretInput {
  title?: string;
  data?: SecretData;
}

export interface SecretWithDecryptedData {
  id: string;
  vaultId: string;
  title: string;
  data: SecretData;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecretWithDecryptedDataAndVault
  extends SecretWithDecryptedData {
  vault: {
    id: string;
    name: string;
  };
}
