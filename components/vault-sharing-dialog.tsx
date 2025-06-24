"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ShareIcon, TrashIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  getVaultSharedUsers,
  searchUsers,
  shareVault,
  revokeVaultAccess,
  updateVaultAccess,
} from "@/app/actions/_sharingActions";
import { useKeyStore } from "@/context/KeyStore";
import type { AccessRole } from "@/generated/prisma";
import { CryptoService } from "@/lib/crypto";
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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface VaultSharingDialogProps {
  vaultId: string;
  vaultName: string;
  wrappedKey: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SharedUser {
  id: string;
  userId: string;
  email: string;
  role: AccessRole;
  createdAt: string | Date;
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
  const queryClient = useQueryClient();
  const { privateKey, isInitialized } = useKeyStore();

  const [_isOpen, _setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  // Form fields
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AccessRole>("VIEWER");

  // Use external isOpen if provided, otherwise use internal state
  const dialogOpen = isOpen !== undefined ? isOpen : _isOpen;

  const handleOpenChange = (open: boolean) => {
    if (isOpen === undefined) {
      _setIsOpen(open);
    }
    onOpenChange?.(open);

    if (open) {
      loadSharedUsers();
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setEmail("");
    setSelectedRole("VIEWER");
    setSearchResults([]);
  };

  const loadSharedUsers = async () => {
    try {
      const response = await getVaultSharedUsers({ vaultId });
      if (response.success) {
        setSharedUsers(response.data);
      } else {
        console.error("Failed to load shared users:", response.error);
        toast.error("Failed to load shared users");
      }
    } catch (error) {
      console.error("Failed to load shared users:", error);
      toast.error("Failed to load shared users");
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchUsers({ email: query });
      if (response.success) {
        setSearchResults(response.data);
      } else {
        console.error("Failed to search users:", response.error);
        toast.error("Failed to search users");
      }
    } catch (error) {
      console.error("Failed to search users:", error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
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

    setIsLoading(true);

    try {
      // Find the target user
      const targetUser = searchResults.find(
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

        // Re-encrypt vault key for target user
        const targetPublicKey = await cryptoService.importPublicKeyFromBase64(
          foundUser.publicKey
        );
        const newWrappedKey = await cryptoService.rewrapVaultKeyForUser({
          wrappedKey,
          ownerPrivateKey: privateKey,
          targetUserPublicKey: targetPublicKey,
        });

        await shareVault({
          vaultId,
          targetUserEmail: email,
          role: selectedRole,
          wrappedKey: newWrappedKey,
        });
      } else {
        // Re-encrypt vault key for target user
        const targetPublicKey = await cryptoService.importPublicKeyFromBase64(
          targetUser.publicKey
        );
        const newWrappedKey = await cryptoService.rewrapVaultKeyForUser({
          wrappedKey,
          ownerPrivateKey: privateKey,
          targetUserPublicKey: targetPublicKey,
        });

        await shareVault({
          vaultId,
          targetUserEmail: email,
          role: selectedRole,
          wrappedKey: newWrappedKey,
        });
      }

      toast.success(`Vault shared with ${email}`);
      await loadSharedUsers();
      resetForm();

      // Invalidate vault queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
    } catch (error) {
      console.error("Failed to share vault:", error);
      toast.error("Failed to share vault");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (userId: string, userEmail: string) => {
    try {
      await revokeVaultAccess({ vaultId, targetUserId: userId });
      toast.success(`Access revoked for ${userEmail}`);
      await loadSharedUsers();

      // Invalidate vault queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
    } catch (error) {
      console.error("Failed to revoke access:", error);
      toast.error("Failed to revoke access");
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: AccessRole,
    userEmail: string
  ) => {
    try {
      const response = await updateVaultAccess({
        vaultId,
        targetUserId: userId,
        role: newRole,
      });
      if (response.success) {
        toast.success(`Role updated for ${userEmail}`);
        await loadSharedUsers();

        // Invalidate vault queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ["vaults"] });
        queryClient.invalidateQueries({ queryKey: ["vault", vaultId] });
      } else {
        console.error("Failed to update role:", response.error);
        toast.error("Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
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
                  {isSearching && (
                    <div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-md border bg-white p-3 shadow-lg">
                      <div className="text-sm text-gray-500">Searching...</div>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value: string) =>
                      setSelectedRole(value as AccessRole)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEWER">
                        Viewer - Can view secrets
                      </SelectItem>
                      <SelectItem value="EDITOR">
                        Editor - Can add and edit secrets
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </div>

          {/* Shared Users List */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Shared With</h3>
            {sharedUsers.length === 0 ? (
              <p className="text-sm text-gray-500">
                No users have access to this vault yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sharedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className="size-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Shared {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole: string) =>
                          handleRoleChange(
                            user.userId,
                            newRole as AccessRole,
                            user.email
                          )
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                          <SelectItem value="EDITOR">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRevokeAccess(user.userId, user.email)
                        }
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Close
            </Button>
          </DialogClose>
          <Button type="submit" form={FORM_ID} disabled={!email || isLoading}>
            {isLoading ? "Sharing..." : "Share Vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
