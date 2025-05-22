"use client";

import { useParams } from "next/navigation";
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
  const { data: vaults } = useQuery({
    queryKey: [SIDEBAR_VAULT_LIST_QUERY_KEY],
    queryFn: getVaults,
    initialData: initialVaults,
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Vaults</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {vaults.map((vault) => (
            <SidebarMenuItem key={vault.id}>
              <SidebarMenuButton asChild isActive={vault.id === vaultId}>
                <a href={`/app/${vault.id}`}>{vault.name}</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export { SIDEBAR_VAULT_LIST_QUERY_KEY, SidebarVaultList };
