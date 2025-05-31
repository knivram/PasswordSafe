import { currentUser } from "@clerk/nextjs/server";
import { getVaults } from "@/app/actions/_vaultActions";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { isErrorResponse } from "@/lib/query-utils";
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

  const response = await getVaults();

  // Handle error responses
  if (isErrorResponse(response)) {
    const { error } = response;
    console.error(`[${error.code}] Failed to load vaults: ${error.message}`);

    // Return a fallback sidebar with limited functionality
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
          <div className="text-muted-foreground p-4 text-center text-sm">
            Unable to load vaults. Please refresh the page.
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    );
  }

  const vaults = response.data;

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
