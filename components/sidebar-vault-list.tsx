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

const SidbarVaultList = ({ vaults }: { vaults: Vault[] }) => {
  const { vaultId } = useParams();

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

export default SidbarVaultList;
