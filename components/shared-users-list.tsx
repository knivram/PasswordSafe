"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, TrashIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  getVaultSharedUsers,
  revokeVaultAccess,
  updateVaultAccess,
} from "@/app/actions/_sharingActions";
import type { AccessRole } from "@/generated/prisma";
import { SHAREABLE_ROLES } from "@/lib/prisma";
import { cn, getRoleDisplayName } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function SharedUsersList({ vaultId }: { vaultId: string }) {
  const queryClient = useQueryClient();

  const { data: sharedUsers = [], isLoading } = useQuery({
    queryKey: ["vault-shared-users", vaultId],
    queryFn: async () => {
      const response = await getVaultSharedUsers({ vaultId });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to load shared users");
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (params: { vaultId: string; targetUserId: string }) => {
      return revokeVaultAccess(params);
    },
    onSuccess: (_, variables) => {
      const user = sharedUsers.find(u => u.userId === variables.targetUserId);
      toast.success(`Access revoked for ${user?.email || "user"}`);
      queryClient.invalidateQueries({
        queryKey: ["vault-shared-users", vaultId],
      });
    },
    onError: error => {
      console.error("Failed to revoke access:", error);
      toast.error("Failed to revoke access");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (params: {
      vaultId: string;
      targetUserId: string;
      role: AccessRole;
    }) => {
      return updateVaultAccess(params);
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        const user = sharedUsers.find(u => u.userId === variables.targetUserId);
        toast.success(`Role updated for ${user?.email || "user"}`);
        queryClient.invalidateQueries({
          queryKey: ["vault-shared-users", vaultId],
        });
      } else {
        throw new Error(response.error?.message || "Failed to update role");
      }
    },
    onError: error => {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
    },
  });

  const handleRevokeAccess = (userId: string, _userEmail: string) => {
    revokeAccessMutation.mutate({ vaultId, targetUserId: userId });
  };

  const handleRoleChange = (
    userId: string,
    newRole: AccessRole,
    _userEmail: string
  ) => {
    updateRoleMutation.mutate({
      vaultId,
      targetUserId: userId,
      role: newRole,
    });
  };
  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading shared users...</p>;
  }

  if (sharedUsers.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No users have access to this vault yet.
      </p>
    );
  }

  return (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-32 justify-between"
                >
                  {getRoleDisplayName(user.role)}
                  <ChevronDownIcon className="size-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SHAREABLE_ROLES.map(role => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() =>
                      handleRoleChange(user.userId, role, user.email)
                    }
                    className={cn(
                      "flex items-center justify-between",
                      user.role === role && "font-bold"
                    )}
                  >
                    {getRoleDisplayName(role)}
                    {user.role === role && <CheckIcon className="size-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRevokeAccess(user.userId, user.email)}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
