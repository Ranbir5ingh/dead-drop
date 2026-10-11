import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { FormSkeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Suspense fallback={<FormSkeleton label="Opening the gate…" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
