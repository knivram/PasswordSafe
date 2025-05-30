"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKeyStoreInit } from "@/context/KeyStore";

export function PasswordDialog() {
  const { isDialogOpen, initializeKeyStore } = useKeyStoreInit();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Password cannot be empty");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await initializeKeyStore(password);
      setPassword("");
    } catch {
      setError("Invalid master password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-[425px]" closable={false}>
        <DialogHeader>
          <DialogTitle>Enter Master Password</DialogTitle>
          <DialogDescription>
            Your master password is required to decrypt your private key.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Master Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your master password"
                autoComplete="current-password"
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <div className="mt-1 flex items-center text-sm text-red-500">
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Decrypting..." : "Unlock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
