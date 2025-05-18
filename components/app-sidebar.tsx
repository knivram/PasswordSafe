import { currentUser } from "@clerk/nextjs/server";

import { SearchForm } from "@/components/search-form";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AccountMenu } from "./account-menu";
import { SidebarAddVaultButton } from "./sidebar-add-vault-button";

const items = [
  {
    title: "Routing",
    url: "#",
  },
  {
    title: "Data Fetching",
    url: "#",
    isActive: true,
  },
  {
    title: "Rendering",
    url: "#",
  },
  {
    title: "Caching",
    url: "#",
  },
  {
    title: "Styling",
    url: "#",
  },
  {
    title: "Optimizing",
    url: "#",
  },
  {
    title: "Configuring",
    url: "#",
  },
  {
    title: "Testing",
    url: "#",
  },
  {
    title: "Authentication",
    url: "#",
  },
  {
    title: "Deploying",
    url: "#",
  },
  {
    title: "Upgrading",
    url: "#",
  },
  {
    title: "Examples",
    url: "#",
  },
];

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await currentUser();
  if (!user) {
    return null;
  }
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <AccountMenu
          email={user.primaryEmailAddress!.emailAddress}
          fullName={user.fullName!}
          imageUrl={user.imageUrl!}
          initials={(user.firstName![0] + user.lastName![0]).toUpperCase()}
        />
        <SearchForm />
        <SidebarAddVaultButton />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Vaults</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url}>{item.title}</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
