"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useKeyStore } from "@/context/KeyStore";
import { SecretsClient } from "@/lib/secrets-client";
import type { SecretData } from "@/types/secret";
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

const CREATE_SECRET_FORM_ID = "create-secret-form";

interface AddSecretDialogProps {
  vaultId: string;
}

export function AddSecretDialog({ vaultId }: AddSecretDialogProps) {
  const secretsClient = new SecretsClient();
  const queryClient = useQueryClient();
  const { isInitialized, publicKey } = useKeyStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreateSecret = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
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

      await secretsClient.createSecret(
        {
          vaultId,
          title,
          data: secretData,
        },
        publicKey
      );

      // Invalidate queries to refresh the secrets list
      queryClient.invalidateQueries({
        queryKey: [SECRETS_LIST_QUERY_KEY, vaultId],
      });

      // Reset form
      setTitle("");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create secret:", error);
      // In a production app, you'd want to show a toast or error message here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Secret
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Secret</DialogTitle>
          <DialogDescription>
            Add a new secret to this vault. All information will be encrypted.
          </DialogDescription>
        </DialogHeader>
        <form id={CREATE_SECRET_FORM_ID} onSubmit={handleCreateSecret}>
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
                type="url"
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
            form={CREATE_SECRET_FORM_ID}
          >
            {isLoading ? "Creating..." : "Create Secret"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
