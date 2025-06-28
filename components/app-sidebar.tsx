import { currentUser } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import { getVaults } from "@/app/actions/_vaultActions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { isErrorResponse } from "@/lib/query-utils";
import { AccountMenu } from "./account-menu";
import { SidebarVaultList } from "./sidebar-vault-list";
import { Button } from "./ui/button";
import { VaultFormDialog } from "./vault-form-dialog";

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
          <VaultFormDialog
            trigger={
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                New Vault
              </Button>
            }
          />
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <VaultFormDialog
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      New Vault
                    </Button>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <SidebarVaultList vaults={vaults} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
