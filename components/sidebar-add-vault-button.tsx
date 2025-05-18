"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogClose, DialogDescription } from "@radix-ui/react-dialog";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "./ui/sidebar";

export function SidebarAddVaultButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [vaultName, setVaultName] = useState("");

  const handleCreateVault = async () => {
    // TODO: Implement vault creation logic here
    console.log("Creating vault:", vaultName);
    setVaultName("");
    setIsOpen(false);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  New Vault
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Vault</DialogTitle>
                  <DialogDescription>
                    Create a new vault to organize your secrets.
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <Label className="hidden" htmlFor="name">
                    Vault Name
                  </Label>
                  <Input
                    id="name"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    placeholder="Enter vault name"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateVault} disabled={!vaultName}>
                    Create Vault
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
