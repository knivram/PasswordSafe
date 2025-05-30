"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useKeyStore } from "@/context/KeyStore";
import { SecretsClient } from "@/lib/secrets-client";
import type { SecretData, SecretWithDecryptedData } from "@/types/secret";
import { SECRETS_LIST_QUERY_KEY } from "./secrets-list";
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

const SECRET_FORM_ID = "secret-form";

interface SecretFormDialogProps {
  vaultId: string;
  trigger?: React.ReactNode;
  secret?: SecretWithDecryptedData; // Optional secret for editing
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SecretFormDialog({
  vaultId,
  trigger,
  secret,
  isOpen,
  onOpenChange,
}: SecretFormDialogProps) {
  const secretsClient = new SecretsClient();
  const queryClient = useQueryClient();
  const { isInitialized, publicKey } = useKeyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [_isOpen, _setIsOpen] = useState(false);

  const isEditing = !!secret;

  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Initialize form with secret data when editing
  useEffect(() => {
    if (secret) {
      setTitle(secret.title);
      setUsername(secret.data.username || "");
      setPassword(secret.data.password || "");
      setUrl(secret.data.url || "");
      setNotes(secret.data.notes || "");
    }
  }, [secret]);

  const resetForm = () => {
    if (!isEditing) {
      setTitle("");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
    }
  };

  // Use external isOpen if provided, otherwise use internal state
  const dialogOpen = isOpen !== undefined ? isOpen : _isOpen;

  const handleOpenChange = (open: boolean) => {
    if (isOpen === undefined) {
      // Uncontrolled mode - manage state internally
      _setIsOpen(open);
    }
    // Always call the callback if provided
    onOpenChange?.(open);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isInitialized) {
      return;
    }
    setIsLoading(true);

    try {
      const secretData: SecretData = {
        username: username || undefined,
        password: password || undefined,
        url: url || undefined,
        notes: notes || undefined,
      };

      if (isEditing) {
        await secretsClient.updateSecret(
          secret.id,
          {
            title,
            data: secretData,
          },
          publicKey
        );
      } else {
        await secretsClient.createSecret(
          {
            vaultId,
            title,
            data: secretData,
          },
          publicKey
        );
      }

      // Invalidate queries to refresh the secrets list
      queryClient.invalidateQueries({
        queryKey: [SECRETS_LIST_QUERY_KEY, vaultId],
      });

      resetForm();
      handleOpenChange(false);
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} secret:`,
        error
      );
      toast.error(`Failed to ${isEditing ? "update" : "create"} secret`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Secret" : "Add New Secret"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the secret information. All changes will be encrypted."
              : "Add a new secret to this vault. All information will be encrypted."}
          </DialogDescription>
        </DialogHeader>
        <form id={SECRET_FORM_ID} onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Gmail Account, Bank Login"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username or email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(e.target.value)
                }
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={!title || isLoading}
            form={SECRET_FORM_ID}
          >
            {isLoading
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Secret"
                : "Create Secret"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
