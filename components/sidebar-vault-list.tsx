"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { List, MoreVerticalIcon, UsersIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteVault, getVaults } from "@/app/actions/_vaultActions";
import { handleActionResponse, getErrorInfo } from "@/lib/query-utils";
import { getRoleDisplayName } from "@/lib/utils";
import type { VaultWithAccess } from "@/types/vault";
import { Badge } from "./ui/badge";
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

function VaultItem({ vault }: { vault: VaultWithAccess }) {
  const { vaultId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    await deleteVault({ vaultId: vault.id });
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
        <div className="flex w-full items-center justify-between gap-2">
          <span className="truncate">{vault.name}</span>
          <div className="flex items-center gap-2">
            {!vault.isOwner && (
              <Badge variant="outline" className="px-1 text-xs">
                {getRoleDisplayName(vault.role)}
              </Badge>
            )}
            {vault.userCount > 1 && (
              <UsersIcon className="text-muted-foreground size-3" />
            )}
          </div>
        </div>
      </SidebarMenuButton>

      {vault.isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction>
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
      )}

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

const SidebarVaultList = ({
  vaults: initialVaults,
}: {
  vaults: VaultWithAccess[];
}) => {
  const { vaultId } = useParams();
  const router = useRouter();
  const { data: vaults, error } = useQuery({
    queryKey: [SIDEBAR_VAULT_LIST_QUERY_KEY],
    queryFn: async () => {
      const response = await getVaults();
      return handleActionResponse(response);
    },
    placeholderData: initialVaults,
  });

  const ownedVaults = useMemo(() => {
    return vaults?.filter(vault => vault.isOwner);
  }, [vaults]);

  const sharedVaults = useMemo(() => {
    return vaults?.filter(vault => !vault.isOwner);
  }, [vaults]);

  // Handle query errors
  if (error) {
    const errorInfo = getErrorInfo(error);
    console.error(
      `[${errorInfo.code}] Failed to load vaults:`,
      errorInfo.message
    );

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
                  <div className="flex w-full items-center justify-between gap-2">
                    <span>All Secrets</span>
                    <List className="size-4" />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Vaults</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="text-muted-foreground p-2 text-center text-sm">
              Unable to load vaults
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    );
  }

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
                <div className="flex w-full items-center justify-between gap-2">
                  <span>All Secrets</span>
                  <List className="size-4" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {/* Owned Vaults */}
      <SidebarGroup>
        <SidebarGroupLabel>My Vaults</SidebarGroupLabel>
        <SidebarGroupContent>
          {!ownedVaults || ownedVaults.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">
              <p className="font-medium">No vaults yet</p>
              <p className="mt-1 text-xs">
                Create your first vault to start storing secrets securely
              </p>
            </div>
          ) : (
            <SidebarMenu>
              {ownedVaults.map(vault => (
                <VaultItem key={vault.id} vault={vault} />
              ))}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Shared Vaults */}
      {sharedVaults && sharedVaults.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Shared With Me</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(vaults || [])
                .filter(vault => vault.isOwner === false)
                .map(vault => (
                  <VaultItem key={vault.id} vault={vault} />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
};

export { SIDEBAR_VAULT_LIST_QUERY_KEY, SidebarVaultList };
