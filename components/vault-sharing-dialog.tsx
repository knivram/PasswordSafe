"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, ShareIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { searchUsers, shareVault } from "@/app/actions/_sharingActions";
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

interface UserSearchResult {
  id: string;
  email: string;
  publicKey: string;
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
  const cryptoService = new CryptoService();
  const { privateKey, isInitialized } = useKeyStore();
  const queryClient = useQueryClient();

  const [_isOpen, _setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

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
      wrappedKey: string;
    }) => {
      return shareVault(params);
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

  const searchUsersMutation = useMutation({
    mutationFn: async (params: { email: string }) => {
      return searchUsers(params);
    },
    onSuccess: response => {
      if (response.success) {
        setSearchResults(response.data);
      } else {
        throw new Error(response.error?.message || "Failed to search users");
      }
    },
    onError: error => {
      console.error("Failed to search users:", error);
      toast.error("Failed to search users");
      setSearchResults([]);
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
    setSearchResults([]);
  };

  const handleSearch = (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    searchUsersMutation.mutate({ email: query });
  };

  const selectUser = (user: UserSearchResult) => {
    setEmail(user.email);
    setSearchResults([]);
  };

  const handleShare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isInitialized || !privateKey) {
      toast.error("Please unlock your vault first");
      return;
    }

    try {
      // Find the target user
      let targetUser = searchResults.find(
        (u: UserSearchResult) => u.email === email
      );

      if (!targetUser) {
        // Search for the user
        const response = await searchUsers({ email });
        if (!response.success) {
          toast.error("Failed to search for user");
          return;
        }
        const foundUser = response.data.find(
          (u: UserSearchResult) => u.email === email
        );
        if (!foundUser) {
          toast.error("User not found with that email address");
          return;
        }
        targetUser = foundUser;
      }

      // Re-encrypt vault key for target user
      const targetPublicKey = await cryptoService.importPublicKeyFromBase64(
        targetUser.publicKey
      );
      const newWrappedKey = await cryptoService.rewrapVaultKeyForUser({
        wrappedKey,
        ownerPrivateKey: privateKey,
        targetUserPublicKey: targetPublicKey,
      });

      shareVaultMutation.mutate({
        vaultId,
        targetUserEmail: email,
        role: selectedRole,
        wrappedKey: newWrappedKey,
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
                    onChange={e => {
                      setEmail(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    placeholder="user@example.com"
                    required
                  />
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border bg-white shadow-lg">
                      {searchResults.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                          onClick={() => selectUser(user)}
                        >
                          <UserIcon className="size-4 text-gray-400" />
                          <span>{user.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchUsersMutation.isPending && (
                    <div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-md border bg-white p-3 shadow-lg">
                      <div className="text-sm text-gray-500">Searching...</div>
                    </div>
                  )}
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
