"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVerticalIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { deleteVault, getVaults } from "@/app/actions/_vaultActions";
import type { Vault } from "@/generated/prisma";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "./ui/sidebar";
import { VaultFormDialog } from "./vault-form-dialog";

const SIDEBAR_VAULT_LIST_QUERY_KEY = "sidebar-vault-list";

function VaultItem({ vault }: { vault: Vault }) {
  const { vaultId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    await deleteVault(vault.id);
    queryClient.invalidateQueries({ queryKey: [SIDEBAR_VAULT_LIST_QUERY_KEY] });
    setIsLoading(false);
    if (vault.id === vaultId) {
      router.push(`/app`);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={vault.id === vaultId}
        onClick={() => router.push(`/app/${vault.id}`)}
      >
        {vault.name}
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreVerticalIcon />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsDeleteDialogOpen(true)}
            variant="destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <VaultFormDialog
        vault={vault}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vault</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{vault.name}&rdquo;? This
              action cannot be undone and all secrets in this vault will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Vault"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  );
}

const SidebarVaultList = ({ vaults: initialVaults }: { vaults: Vault[] }) => {
  const { vaultId } = useParams();
  const router = useRouter();
  const { data: vaults } = useQuery({
    queryKey: [SIDEBAR_VAULT_LIST_QUERY_KEY],
    queryFn: getVaults,
    initialData: initialVaults,
  });

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem key="all-vaults">
              <SidebarMenuButton
                isActive={vaultId === undefined}
                onClick={() => router.push(`/app`)}
              >
                All Vaults
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem key="favorites">
              <SidebarMenuButton
                isActive={vaultId === "favorites"}
                onClick={() => router.push(`/app/favorites`)}
              >
                Favorites
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Vaults</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {vaults.map(vault => (
              <VaultItem key={vault.id} vault={vault} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export { SIDEBAR_VAULT_LIST_QUERY_KEY, SidebarVaultList };
