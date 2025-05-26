"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { createVault } from "@/app/actions/_vaultActions";
import { useKeyStore } from "@/context/KeyStore";
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
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "./ui/sidebar";

const CREATE_VAULT_FORM_ID = "create-vault-form";

export function SidebarAddVaultButton() {
  const cryptoService = new CryptoService();
  const queryClient = useQueryClient();
  const { isInitialized, publicKey } = useKeyStore();
  const [isOpen, setIsOpen] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateVault = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isInitialized) {
      return;
    }
    setIsLoading(true);
    const { wrappedKey } =
      await cryptoService.generateAndWrapVaultKey(publicKey);

    await createVault({
      name: vaultName,
      wrappedKey,
    });

    queryClient.invalidateQueries({
      queryKey: [SIDEBAR_VAULT_LIST_QUERY_KEY],
    });

    setVaultName("");
    setIsOpen(false);
    setIsLoading(false);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  New Vault
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Vault</DialogTitle>
                  <DialogDescription>
                    Create a new vault to organize your secrets.
                  </DialogDescription>
                </DialogHeader>
                <form id={CREATE_VAULT_FORM_ID} onSubmit={handleCreateVault}>
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
                    form={CREATE_VAULT_FORM_ID}
                  >
                    Create Vault
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
