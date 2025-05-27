import { AppSidebar } from "@/components/app-sidebar";
import { PasswordDialog } from "@/components/password-dialog";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { KeyStoreProvider } from "@/context/KeyStore";

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
          <header className="bg-background/80 sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm">
            <SidebarTrigger className="-ml-1" />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KeyStoreProvider>
  );
}
