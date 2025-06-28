"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, ShareIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { findUserForSharing, shareVault } from "@/app/actions/_sharingActions";
import { useKeyStore } from "@/context/KeyStore";
import type { AccessRole } from "@/generated/prisma";
import { CryptoService } from "@/lib/crypto";
import { SHAREABLE_ROLES } from "@/lib/prisma";
import { cn, getRoleDisplayName } from "@/lib/utils";
import { SharedUsersList } from "./shared-users-list";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface VaultSharingDialogProps {
  vaultId: string;
  vaultName: string;
  wrappedKey: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FORM_ID = "vault-sharing-form";

export function VaultSharingDialog({
  vaultId,
  vaultName,
  wrappedKey,
  trigger,
  isOpen,
  onOpenChange,
}: VaultSharingDialogProps) {
  const { privateKey, isInitialized } = useKeyStore();
  const queryClient = useQueryClient();

  const [_isOpen, _setIsOpen] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AccessRole>("VIEWER");

  // Use external isOpen if provided, otherwise use internal state
  const dialogOpen = isOpen !== undefined ? isOpen : _isOpen;

  // Mutations
  const shareVaultMutation = useMutation({
    mutationFn: async (params: {
      vaultId: string;
      targetUserEmail: string;
      role: AccessRole;
    }) => {
      // First find the user and get their public key
      const targetUserResponse = await findUserForSharing({ email: params.targetUserEmail });
      
      if (!targetUserResponse.success) {
        throw new Error(targetUserResponse.error?.message || "Failed to find user");
      }
      
      const targetUser = targetUserResponse.data;
      
      if (!privateKey || !isInitialized) {
        throw new Error("Private key not available");
      }
      
      // Rewrap the vault key for the target user
      const crypto = new CryptoService();
      const targetUserPublicKey = await crypto.importPublicKeyFromBase64(targetUser.publicKey);
      const newWrappedKey = await crypto.rewrapVaultKeyForUser({
        wrappedKey,
        ownerPrivateKey: privateKey,
        targetUserPublicKey,
      });
      
      // Share the vault with the properly wrapped key
      return shareVault({
        vaultId: params.vaultId,
        targetUserId: targetUser.id,
        role: params.role,
        wrappedKey: newWrappedKey,
      });
    },
    onSuccess: (_, variables) => {
      toast.success(`Vault shared with ${variables.targetUserEmail}`);
      resetForm();
      queryClient.invalidateQueries({
        queryKey: ["vault-shared-users", vaultId],
      });
    },
    onError: error => {
      console.error("Failed to share vault:", error);
      toast.error("Failed to share vault");
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (isOpen === undefined) {
      _setIsOpen(open);
    }
    onOpenChange?.(open);

    if (!open) {
      resetForm();
    }
  };

  const resetForm = () => {
    setEmail("");
    setSelectedRole("VIEWER");
  };

  const handleShare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isInitialized || !privateKey) {
      toast.error("Please unlock your vault first");
      return;
    }

    try {
      shareVaultMutation.mutate({
        vaultId,
        targetUserEmail: email,
        role: selectedRole,
      });
    } catch (error) {
      console.error("Failed to share vault:", error);
      toast.error("Failed to share vault");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareIcon className="size-5" />
            Share &quot;{vaultName}&quot;
          </DialogTitle>
          <DialogDescription>
            Share this vault with other PasswordSafe users. All secrets will
            remain encrypted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Add User</h3>
            <form id={FORM_ID} onSubmit={handleShare}>
              <div className="grid gap-4">
                <div className="relative grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-between"
                        type="button"
                      >
                        {getRoleDisplayName(selectedRole)}
                        <ChevronDownIcon className="size-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-full">
                      {SHAREABLE_ROLES.map(role => (
                        <DropdownMenuItem
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          className={cn(
                            "flex items-center justify-between",
                            selectedRole === role && "font-bold"
                          )}
                        >
                          {getRoleDisplayName(role, true)}
                          {selectedRole === role && (
                            <CheckIcon className="size-4" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </form>
          </div>

          {/* Shared Users List */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Shared With</h3>
            <SharedUsersList vaultId={vaultId} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={shareVaultMutation.isPending}>
              Close
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={!email || shareVaultMutation.isPending}
          >
            {shareVaultMutation.isPending ? "Sharing..." : "Share Vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
