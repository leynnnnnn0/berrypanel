"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  Copy,
  ExternalLink,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type UserResponse = {
  id: number;
  name: string;
  email: string;
  linux_username?: string | null;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  async function copyValue() {
    await navigator.clipboard.writeText(value);
  }

  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      className="grid size-9 place-items-center rounded-full text-[#7047f5] transition hover:bg-[#f0ecff]"
      onClick={copyValue}
    >
      <Copy className="size-5" />
    </button>
  );
}

function DetailRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-t border-black/10 py-6 first:border-t-0">
      <span className="text-[#666]">{label}</span>
      <div className="flex min-w-0 items-center gap-4">
        <span className="truncate text-right font-semibold text-[#151515]">
          {value}
        </span>
        {action}
      </div>
    </div>
  );
}

export default function SshAccessPage() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await api<UserResponse>("/api/user");
        setUser(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load SSH user");
      }
    }

    loadUser();
  }, []);

  const sshHost =
    process.env.NEXT_PUBLIC_SSH_HOST ||
    (typeof window !== "undefined" ? window.location.hostname : "your-server");
  const sshPort = process.env.NEXT_PUBLIC_SSH_PORT || "22";
  const username = user?.linux_username || "provisioning";
  const sshCommand = `ssh -p ${sshPort} ${username}@${sshHost}`;

  const details = useMemo(
    () => [
      ["IP / Host", sshHost],
      ["Port", sshPort],
      ["Username", username],
      ["Password", "Use your BerryPanel SSH password"],
    ],
    [sshHost, sshPort, username],
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#121212]">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <section>
          <h1 className="text-5xl font-semibold leading-none">SSH Access</h1>
          <p className="mt-4 max-w-2xl text-lg leading-6 text-[#666]">
            Use SSH for secure terminal access and Git-based Laravel deployment
            tasks on your provisioned BerryPanel workspace.
          </p>
        </section>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.6fr]">
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
            <div className="flex items-center gap-3 px-6 py-5">
              <KeyRound className="size-6" />
              <h2 className="text-2xl font-semibold">SSH details</h2>
            </div>
            <div className="border-t border-black/10 px-6">
              {details.map(([label, value]) => (
                <DetailRow
                  key={label}
                  label={label}
                  value={value}
                  action={
                    label === "Password" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-full text-[#7047f5]"
                      >
                        Change
                      </Button>
                    ) : (
                      <CopyButton value={value} label={label} />
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-2xl font-semibold">SSH status</h2>
                <p className="mt-5 text-base leading-6 text-[#666]">
                  SSH allows secure access to your hosting files and server
                  commands.
                </p>
              </div>
              <span className="rounded-full bg-[#dff8c8] px-4 py-2 text-sm font-semibold text-[#15713b]">
                ACTIVE
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-6 h-11 rounded-xl px-5 text-[#7047f5]"
            >
              Disable
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-black/10 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-black/10 px-6 py-5">
            <h2 className="text-2xl font-semibold">Log in to SSH</h2>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-[#7047f5]"
            >
              <ExternalLink className="size-4" />
              How to log in?
            </Button>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            <div className="p-6 lg:border-r lg:border-black/10">
              <h3 className="text-xl font-semibold">
                Use a built-in terminal on your device
              </h3>
              <p className="mt-4 text-base leading-6 text-[#666]">
                Open your terminal and paste this command. You will be asked for
                your SSH password.
              </p>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-[#f0ecff] px-6 py-5 font-mono text-sm">
                <span className="break-all">{sshCommand}</span>
                <CopyButton value={sshCommand} label="SSH command" />
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold">Use SSH client</h3>
              <p className="mt-4 text-base leading-6 text-[#666]">
                Use your preferred SSH client and enter the SSH details shown
                above.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-8 h-11 rounded-xl px-8 text-[#7047f5]"
              >
                PuTTY
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-[#fff0b8] p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 shrink-0" />
            <p className="text-sm leading-6 text-[#5f5223]">
              SSH access is tied to your BerryPanel Linux username. Later, we
              will add per-site SSH keys and password rotation from this page.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
