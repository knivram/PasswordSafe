"use client";

import { useUser } from "@clerk/nextjs";
import { AlertCircle, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { finishOnboarding } from "@/app/actions/_userActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cryptoService } from "@/lib/crypto";
import { isErrorResponse, getErrorInfo } from "@/lib/query-utils";
import { cn } from "@/lib/utils";

const passwordRequirements = [
  { id: "length", label: "Length: at least 12 characters", test: (pwd: string) => pwd.length >= 12 },
  { id: "uppercase", label: "At least 1 uppercase letter (A–Z)", test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: "lowercase", label: "At least 1 lowercase letter (a–z)", test: (pwd: string) => /[a-z]/.test(pwd) },
  { id: "number", label: "At least 1 number (0–9)", test: (pwd: string) => /\d/.test(pwd) },
  { id: "special", label: "At least 1 special character (!@#$%^&*()_+-", test: (pwd: string) => /[!@#$%^&*()_+\-]/.test(pwd) },
];

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

  const passwordChecks = useMemo(() => {
    return passwordRequirements.map(req => ({
      ...req,
      isValid: req.test(password)
    }));
  }, [password]);

  const isPasswordValid = passwordChecks.every(check => check.isValid);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!isPasswordValid) {
      setError("Password does not meet all requirements");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { publicKey, wrappedPrivateKey, salt, wrappedDefaultVaultKey } =
        await cryptoService.onboarding(password);

      const response = await finishOnboarding({
        salt,
        publicKey,
        wrappedPrivateKey,
        wrappedDefaultVaultKey: wrappedDefaultVaultKey,
      });

      // Handle error responses
      if (isErrorResponse(response)) {
        const { error } = response;
        console.error(`[${error.code}] Onboarding failed: ${error.message}`);

        const errorMessage =
          error.code === "ONBOARDING_FAILED"
            ? "Failed to complete onboarding. Please try again."
            : error.code === "UNAUTHORIZED"
              ? "Authentication failed. Please sign in again."
              : error.message;

        setError(errorMessage);
        return;
      }

      await user?.reload();
      router.push("/");
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      console.error("Finish onboarding error:", error);
      setError(
        errorInfo.message || "An unexpected error occurred. Please try again."
      );
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
              Set your <strong>master password</strong> to finish your
              onboarding.
            </p>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p>
                  This password <strong>cannot be reset</strong>. If forgotten,
                  you will lose access to your encrypted data permanently.
                </p>
              </AlertDescription>
            </Alert>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-red-500"
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
                    <span className="text-muted-foreground text-xs">
                      (encryption key)
                    </span>
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {password && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                    {passwordChecks.map((check) => (
                      <div key={check.id} className="flex items-center gap-2 text-xs">
                        {check.isValid ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span className={check.isValid ? "text-green-600" : "text-red-600"}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                  onChange={e => setRepeatPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isPasswordValid || password !== repeatPassword}
              >
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


