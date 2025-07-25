"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getUserData } from "@/app/actions/_userActions";
import { cryptoService } from "@/lib/crypto";
import { isErrorResponse } from "@/lib/query-utils";

interface KeyStoreInitContextType {
  isInitialized: boolean;
  isDialogOpen: boolean;
  initializeKeyStore: (masterPassword: string) => Promise<void>;
  clearKeyStore: () => void;
  openDialog: () => void;
  closeDialog: () => void;
}

type KeyStoreReadContextType =
  | {
      isInitialized: false;
      publicKey: null;
      privateKey: null;
    }
  | {
      isInitialized: true;
      publicKey: CryptoKey;
      privateKey: CryptoKey;
    };

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- must be done to initialize
const KeyStoreInitContext = createContext<KeyStoreInitContextType>(null!);
const KeyStoreReadContext = createContext<KeyStoreReadContextType>({
  isInitialized: false,
  publicKey: null,
  privateKey: null,
});

export function KeyStoreProvider({ children }: { children: ReactNode }) {
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [publicKey, setPublicKey] = useState<CryptoKey | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isInitialized = privateKey !== null && publicKey !== null;

  useEffect(() => {
    if (!isInitialized && !isDialogOpen) {
      setIsDialogOpen(true);
    }
  }, [isInitialized, isDialogOpen]);

  const initializeKeyStore = useCallback(async (masterPassword: string) => {
    try {
      const response = await getUserData();

      // Handle error responses
      if (isErrorResponse(response)) {
        const { error } = response;
        console.error(
          `[${error.code}] Failed to get user data: ${error.message}`
        );

        // Create a more specific error message for the user
        const errorMessage =
          error.code === "UNAUTHORIZED"
            ? "You need to sign in to access your data."
            : error.code === "NOT_FOUND"
              ? "User data not found. Please complete onboarding first."
              : "Failed to load your encryption keys. Please try again.";

        throw new Error(errorMessage);
      }

      const userData = response.data;

      const { publicKey, privateKey } =
        await cryptoService.importPublicPrivateKey({
          publicKeyBase64: userData.publicKey,
          wrappedPrivateKeyBase64: userData.wrappedPrivateKey,
          password: masterPassword,
          salt: userData.salt,
        });
      setPrivateKey(privateKey);
      setPublicKey(publicKey);

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to initialize key store:", error);
      throw error;
    }
  }, []);

  const clearKeyStore = useCallback(() => {
    setPrivateKey(null);
    setPublicKey(null);
  }, []);

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (isInitialized) {
      setIsDialogOpen(false);
    }
  }, [isInitialized]);

  return (
    <KeyStoreInitContext.Provider
      value={{
        isInitialized,
        isDialogOpen,
        initializeKeyStore,
        clearKeyStore,
        openDialog,
        closeDialog,
      }}
    >
      <KeyStoreReadContext.Provider
        value={
          isInitialized
            ? {
                isInitialized: true,
                privateKey,
                publicKey,
              }
            : {
                isInitialized: false,
                privateKey: null,
                publicKey: null,
              }
        }
      >
        {children}
      </KeyStoreReadContext.Provider>
    </KeyStoreInitContext.Provider>
  );
}

export const useKeyStoreInit = () => useContext(KeyStoreInitContext);

export const useKeyStore = () => useContext(KeyStoreReadContext);
