"use client";

import { useParams, useRouter } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { Vault } from "@/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import { getVaults } from "@/app/actions/_vaultActions";

const SIDEBAR_VAULT_LIST_QUERY_KEY = "sidebar-vault-list";

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
            <SidebarMenuItem key={"all-vaults"}>
              <SidebarMenuButton
                isActive={vaultId === undefined}
                onClick={() => router.push(`/app`)}
              >
                All Vaults
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem key={"favorites"}>
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
            {vaults.map((vault) => (
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
