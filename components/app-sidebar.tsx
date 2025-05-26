import { currentUser } from "@clerk/nextjs/server";
import { getVaults } from "@/app/actions/_vaultActions";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AccountMenu } from "./account-menu";
import { SidebarAddVaultButton } from "./sidebar-add-vault-button";
import { SidebarVaultList } from "./sidebar-vault-list";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await currentUser();
  if (!user) {
    return null;
  }

  const vaults = await getVaults();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <AccountMenu
          // TODO: handle edge cases where user data is not available
          email={user.primaryEmailAddress?.emailAddress || ""}
          fullName={user.fullName || ""}
          imageUrl={user.imageUrl || ""}
          initials={(user.firstName || "")[0] + (user.lastName || "")[0]}
        />
        <SidebarAddVaultButton />
      </SidebarHeader>
      <SidebarContent>
        <SidebarVaultList vaults={vaults} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
