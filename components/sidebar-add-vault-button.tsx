"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createVault } from "@/app/actions/_vaultActions";
import { useKeyStore } from "@/context/KeyStore";
import { CryptoService } from "@/lib/crypto";
import { isErrorResponse, getErrorInfo } from "@/lib/query-utils";
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

    try {
      const { wrappedKey } =
        await cryptoService.generateAndWrapVaultKey(publicKey);

      const response = await createVault({
        name: vaultName,
        wrappedKey,
      });

      // Handle error responses
      if (isErrorResponse(response)) {
        const { error } = response;
        console.error(
          `[${error.code}] Failed to create vault: ${error.message}`
        );

        const errorMessage =
          error.code === "UNAUTHORIZED"
            ? "You need to sign in to create a vault."
            : error.code === "DATABASE_ERROR"
              ? "Failed to save vault. Please try again."
              : error.message;

        toast.error(errorMessage);
        return;
      }

      // Success - invalidate queries to refresh the vault list
      queryClient.invalidateQueries({
        queryKey: [SIDEBAR_VAULT_LIST_QUERY_KEY],
      });

      setVaultName("");
      setIsOpen(false);
      toast.success("Vault created successfully!");
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      console.error("Create vault error:", error);
      toast.error(
        errorInfo.message || "Failed to create vault. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
                    {isLoading ? "Creating..." : "Create Vault"}
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
