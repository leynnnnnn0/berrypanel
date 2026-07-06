"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";

function LoginPageContent() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const wasReset = searchParams.get("reset") === "true";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await api("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          remember: form.get("remember") == null ? false : true,
        }),
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Panel Login"
      title="Welcome Back To Your Panel"
      subtitle="Sign in to manage Laravel sites, databases, deployments, and server status."
      mode="login"
    >
      <div className="rounded-[26px] bg-[#f6f6f6] p-5 md:p-7">
        {wasReset && (
          <p className="mb-4 rounded-2xl bg-[#d8cef2] px-4 py-3 text-sm text-[#252525]">
            Password reset successfully. Please log in.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[16px] text-[#333]">Email</Label>
            <Input
              required
              name="email"
              type="email"
              placeholder="email@example.com"
              className="h-14 rounded-full border-[#d8d8d8] bg-white px-6 text-[17px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[16px] text-[#333]">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-[#555] underline-offset-4 hover:underline"
              >
                Forgot Password
              </Link>
            </div>
            <Input
              required
              name="password"
              type="password"
              placeholder="••••••••"
              className="h-14 rounded-full border-[#d8d8d8] bg-white px-6 text-[17px]"
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <FieldGroup>
            <Field orientation="horizontal" className="gap-3">
              <Checkbox id="remember" name="remember" />
              <FieldLabel htmlFor="remember" className="text-[#555]">
                Remember Me
              </FieldLabel>
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            className="h-14 w-full rounded-full bg-black text-[17px] text-white hover:bg-black/85"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login to BerryPanel"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[15px] text-[#777]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-black">
            Create customer account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
