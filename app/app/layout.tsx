import { AppSidebar } from "@/components/app-sidebar";
import { PasswordDialog } from "@/components/password-dialog";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { KeyStoreProvider } from "../context/KeyStore";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KeyStoreProvider>
      <PasswordDialog />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KeyStoreProvider>
  );
}
