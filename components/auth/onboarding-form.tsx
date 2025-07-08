"use client";

import { useUser } from "@clerk/nextjs";
import { AlertCircle, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, "At least 12 characters")
      .regex(/[A-Z]/, "At least 1 uppercase letter (A–Z)")
      .regex(/[a-z]/, "At least 1 lowercase letter (a–z)")
      .regex(/\d/, "At least 1 number (0–9)")
      .regex(
        /[!@#$%^&*()_+\-]/,
        "At least 1 special character (!@#$%^&*()_+-)"
      ),
    repeatPassword: z.string(),
  })
  .refine(data => data.password === data.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setError("");
    setIsLoading(true);
    try {
      const { publicKey, wrappedPrivateKey, salt, wrappedDefaultVaultKey } =
        await cryptoService.onboarding(data.password);

      const response = await finishOnboarding({
        salt,
        publicKey,
        wrappedPrivateKey,
        wrappedDefaultVaultKey,
      });

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {...register("password")}
                />
                {errors.password && (
                  <div className="pt-1 text-xs text-red-600">
                    {errors.password.message as string}
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
                  {...register("repeatPassword")}
                />
                {errors.repeatPassword && (
                  <div className="text-xs text-red-600 pt-1">
                    {errors.repeatPassword.message as string}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading || !isValid
                }
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
