"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await api("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          password_confirmation: form.get("password_confirmation"),
        }),
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Customer Registration"
      title="Create Your Hosting Account"
      subtitle="Request access to host Laravel and Inertia projects on your BerryPanel server."
      mode="register"
    >
      <div className="rounded-[26px] bg-[#f6f6f6] p-5 md:p-7">
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[16px] text-[#333]">Name</Label>
            <Input
              name="name"
              type="text"
              placeholder="Juan dela Cruz"
              required
              className="h-14 rounded-full border-[#d8d8d8] bg-white px-6 text-[17px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[16px] text-[#333]">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="email@example.com"
              required
              className="h-14 rounded-full border-[#d8d8d8] bg-white px-6 text-[17px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[16px] text-[#333]">Password</Label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="h-14 rounded-full border-[#d8d8d8] bg-white px-6 text-[17px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[16px] text-[#333]">Confirm Password</Label>
            <Input
              name="password_confirmation"
              type="password"
              placeholder="••••••••"
              required
              className="h-14 rounded-full border-[#d8d8d8] bg-white px-6 text-[17px]"
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="h-14 w-full rounded-full bg-black text-[17px] text-white hover:bg-black/85"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[15px] text-[#777]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-black">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
