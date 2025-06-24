"use client";

import { useQuery } from "@tanstack/react-query";
import { ShareIcon, UserIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getVaults } from "@/app/actions/_vaultActions";
import type { Vault, AccessRole } from "@/generated/prisma";
import { handleActionResponse, getErrorInfo } from "@/lib/query-utils";
import { Badge } from "./ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

interface VaultWithAccess extends Vault {
  isOwner?: boolean;
  role?: AccessRole | "OWNER";
}

const SIDEBAR_VAULT_LIST_QUERY_KEY = "sidebar-vault-list";

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
    initialData: initialVaults,
  });

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
      {/* Owned Vaults */}
      <SidebarGroup>
        <SidebarGroupLabel>My Vaults</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {vaults
              .filter(vault => vault.isOwner !== false)
              .map(vault => (
                <SidebarMenuItem key={vault.id}>
                  <SidebarMenuButton
                    isActive={vault.id === vaultId}
                    onClick={() => router.push(`/app/${vault.id}`)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span>{vault.name}</span>
                      <UserIcon className="text-muted-foreground size-3" />
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Shared Vaults */}
      {vaults.some(vault => vault.isOwner === false) && (
        <SidebarGroup>
          <SidebarGroupLabel>Shared With Me</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vaults
                .filter(vault => vault.isOwner === false)
                .map(vault => (
                  <SidebarMenuItem key={vault.id}>
                    <SidebarMenuButton
                      isActive={vault.id === vaultId}
                      onClick={() => router.push(`/app/${vault.id}`)}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span>{vault.name}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="px-1 text-xs">
                            {vault.role?.toLowerCase()}
                          </Badge>
                          <ShareIcon className="text-muted-foreground size-3" />
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
};

export { SIDEBAR_VAULT_LIST_QUERY_KEY, SidebarVaultList };
