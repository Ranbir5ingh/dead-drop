import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { FormSkeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<FormSkeleton label="Opening the gate…" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
