import React from "react";
import { SignUpForm } from "@/components/auth/onboarding-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
