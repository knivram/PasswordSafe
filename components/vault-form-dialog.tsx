"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { createVault, updateVault } from "@/app/actions/_vaultActions";
import { useKeyStore } from "@/context/KeyStore";
import type { Vault } from "@/generated/prisma";
import { CryptoService } from "@/lib/crypto";
import { SIDEBAR_VAULT_LIST_QUERY_KEY } from "./sidebar-vault-list";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const VAULT_FORM_ID = "vault-form";

interface VaultFormDialogProps {
  trigger?: React.ReactNode;
  vault?: Vault; // Optional vault for editing
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VaultFormDialog({
  trigger,
  vault,
  isOpen,
  onOpenChange,
}: VaultFormDialogProps) {
  const cryptoService = new CryptoService();
  const queryClient = useQueryClient();
  const { isInitialized, publicKey } = useKeyStore();
  const [_isOpen, _setIsOpen] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!vault;

  // Initialize form with vault data when editing
  useEffect(() => {
    if (vault) {
      setVaultName(vault.name);
    }
  }, [vault]);

  const resetForm = () => {
    if (!isEditing) {
      setVaultName("");
    }
  };

  // Use external isOpen if provided, otherwise use internal state
  const dialogOpen = isOpen !== undefined ? isOpen : _isOpen;

  const handleOpenChange = (open: boolean) => {
    if (isOpen === undefined) {
      // Uncontrolled mode - manage state internally
      _setIsOpen(open);
    }
    // Always call the callback if provided
    onOpenChange?.(open);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isInitialized) {
      return;
    }
    setIsLoading(true);

    try {
      if (isEditing) {
        await updateVault({ id: vault.id, name: vaultName });
      } else {
        const { wrappedKey } =
          await cryptoService.generateAndWrapVaultKey(publicKey);

        await createVault({
          name: vaultName,
          wrappedKey,
        });
      }

      queryClient.invalidateQueries({
        queryKey: [SIDEBAR_VAULT_LIST_QUERY_KEY],
      });

      resetForm();
      handleOpenChange(false);
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} vault:`,
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Vault" : "Create New Vault"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Change the vault name."
              : "Create a new vault to organize your secrets."}
          </DialogDescription>
        </DialogHeader>
        <form id={VAULT_FORM_ID} onSubmit={handleSubmit}>
          <Label className="hidden" htmlFor="name">
            Vault Name
          </Label>
          <Input
            id="name"
            value={vaultName}
            onChange={e => setVaultName(e.target.value)}
            placeholder="Enter vault name"
          />
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={!vaultName || isLoading}
            form={VAULT_FORM_ID}
          >
            {isLoading
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Save"
                : "Create Vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
