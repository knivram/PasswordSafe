"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ab2b64,
  deriveKek,
  generateKeyPair,
  wrapPrivateKey,
} from "@/lib/crypto";
import { finishOnboarding } from "@/app/actions/_authActions";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthError } from "@/lib/errors";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { user } = useUser();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (password !== repeatPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const saltArr = crypto.getRandomValues(new Uint8Array(16));
      const salt = ab2b64(saltArr.buffer);
      const { publicKey, privateKey } = await generateKeyPair();

      const kek = await deriveKek(password, saltArr);
      const wrappedPrivBuf = await wrapPrivateKey(privateKey, kek);
      const wrappedPrivateKeyB64 = ab2b64(wrappedPrivBuf);

      const pubBuf = await crypto.subtle.exportKey("spki", publicKey);
      const publicKeyB64 = ab2b64(pubBuf);

      await finishOnboarding({
        salt,
        publicKey: publicKeyB64,
        wrappedPrivateKey: wrappedPrivateKeyB64,
      });

      await user?.reload();

      router.push("/");
    } catch (error) {
      if (error instanceof AuthError) {
        setError(error.message);
      } else {
        console.error("Finish onboarding error:", error);
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Welcome, {user?.firstName || "there"}!
          </CardTitle>
          <CardDescription className="space-y-4">
            <p>
              Set your <strong>master password</strong>{" "}
              to finish your onboarding.
            </p>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p>
                  This password{" "}
                  <strong>cannot be reset</strong>. If forgotten, you will lose
                  access to your encrypted data permanently.
                </p>
              </AlertDescription>
            </Alert>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div
                className="p-3 text-sm text-red-500 bg-red-50 rounded-md"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">
                    Master Password{" "}
                    <span className="text-xs text-muted-foreground">
                      (encryption key)
                    </span>
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">
                    Repeat Master Password
                  </Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Setting master password..."
                  : "Set master password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
