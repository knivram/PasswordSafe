"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getVaults } from "@/app/actions/_vaultActions";
import type { Vault } from "@/generated/prisma";
import { handleActionResponse, getErrorInfo } from "@/lib/query-utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const SIDEBAR_VAULT_LIST_QUERY_KEY = "sidebar-vault-list";

const SidebarVaultList = ({ vaults: initialVaults }: { vaults: Vault[] }) => {
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
      <SidebarGroup>
        <SidebarGroupLabel>Vaults</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {vaults.map(vault => (
              <SidebarMenuItem key={vault.id}>
                <SidebarMenuButton
                  isActive={vault.id === vaultId}
                  onClick={() => router.push(`/app/${vault.id}`)}
                >
                  {vault.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export { SIDEBAR_VAULT_LIST_QUERY_KEY, SidebarVaultList };
