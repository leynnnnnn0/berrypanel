"use client";

import { Button } from "@/components/ui/button";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  ServerCog,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SshAccessResponse = {
  ssh: {
    host: string;
    port: number;
    username?: string | null;
    enabled: boolean;
    public_key?: string | null;
  };
};

function CopyButton({ value, label }: { value: string; label: string }) {
  async function copyValue() {
    await navigator.clipboard.writeText(value);
  }

  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      className="grid size-9 place-items-center rounded-full text-[#567C8D] transition hover:bg-[#C8D9E6]"
      onClick={copyValue}
    >
      <Copy className="size-5" />
    </button>
  );
}

function DetailRow({
  label,
  value,
  canCopy = true,
}: {
  label: string;
  value: string;
  canCopy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-t border-[#2F4156]/10 py-6 first:border-t-0">
      <span className="text-[#567C8D]">{label}</span>
      <div className="flex min-w-0 items-center gap-4">
        <span className="truncate text-right font-semibold text-[#2F4156]">
          {value}
        </span>
        {canCopy && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}

export default function SshAccessPage() {
  const [ssh, setSsh] = useState<SshAccessResponse["ssh"] | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  useEffect(() => {
    void loadSsh();
  }, []);

  async function loadSsh() {
    try {
      setLoading(true);
      setError("");
      const response = await api<SshAccessResponse>("/api/ssh-access");
      setSsh(response.ssh);
      setPublicKey(response.ssh.public_key ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load SSH access");
    } finally {
      setLoading(false);
    }
  }

  async function enableSsh() {
    try {
      setSaving(true);
      setError("");
      setNotice("");
      const response = await api<SshAccessResponse>("/api/ssh-access", {
        method: "PUT",
        body: JSON.stringify({ public_key: publicKey }),
      });
      setSsh(response.ssh);
      setPublicKey(response.ssh.public_key ?? "");
      setNotice("SSH access is enabled. You can now connect with your private key.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to enable SSH access");
    } finally {
      setSaving(false);
    }
  }

  async function disableSsh() {
    try {
      setSaving(true);
      setError("");
      setNotice("");
      const response = await api<SshAccessResponse>("/api/ssh-access", {
        method: "DELETE",
      });
      setSsh(response.ssh);
      setPublicKey("");
      setDisableOpen(false);
      setNotice("SSH access is disabled for this account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to disable SSH access");
    } finally {
      setSaving(false);
    }
  }

  const host = ssh?.host || "your-server";
  const port = String(ssh?.port || 22);
  const username = ssh?.username || "provisioning";
  const enabled = Boolean(ssh?.enabled);
  const keyPath = "~/.ssh/berrypanel";
  const createKeyCommand = `ssh-keygen -t ed25519 -f ${keyPath} -C "berrypanel"`;
  const showPublicKeyCommand = `cat ${keyPath}.pub`;
  const sshCommand = `ssh -i ${keyPath} -p ${port} ${username}@${host}`;

  const details = useMemo(
    () => [
      ["IP / Host", host],
      ["Port", port],
      ["Username", username],
      ["Auth", enabled ? "Public key enabled" : "Add a public key first"],
    ],
    [enabled, host, port, username],
  );

  return (
    <DashboardPage>
        <DashboardHero
          eyebrow="Secure access · Command workspace"
          title="SSH Access"
          description="Add your SSH public key to access the BerryPanel workspace and run Laravel migrations, queues, and maintenance commands."
          icon={KeyRound}
          contextValue="Key-based server access"
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Connection" value={loading?"...":enabled?"Enabled":"Disabled"} detail={host} icon={ServerCog} tone="lavender" />
          <MetricCard label="Port" value={port} detail="secure shell port" icon={Terminal} tone="sky" />
          <MetricCard label="Username" value={username} detail="server account" icon={KeyRound} tone="mist" />
          <MetricCard label="Authentication" value={enabled?"Public key":"Pending"} detail="passwordless access" icon={ShieldCheck} tone="slate" />
        </section>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {notice && (
          <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {notice}
          </p>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.6fr]">
          <div className="overflow-hidden rounded-3xl border border-[#2F4156]/10 bg-white">
            <div className="flex items-center gap-3 px-6 py-5">
              <KeyRound className="size-6" />
              <h2 className="text-2xl font-semibold">SSH details</h2>
            </div>
            <div className="border-t border-[#2F4156]/10 px-6">
              {loading ? (
                <div className="flex items-center gap-3 py-10 text-[#567C8D]">
                  <Loader2 className="size-5 animate-spin" />
                  Loading SSH details
                </div>
              ) : (
                details.map(([label, value]) => (
                  <DetailRow
                    key={label}
                    label={label}
                    value={value}
                    canCopy={label !== "Auth"}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#2F4156]/10 bg-white p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-2xl font-semibold">SSH status</h2>
                <p className="mt-5 text-base leading-6 text-[#567C8D]">
                  Key-based SSH lets you log in without BerryPanel storing or
                  showing a server password.
                </p>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  enabled
                    ? "bg-[#dff8c8] text-[#15713b]"
                    : "bg-[#F1F1F1] text-[#567C8D]"
                }`}
              >
                {enabled ? "ACTIVE" : "OFF"}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-6 h-11 rounded-xl px-5 text-[#567C8D]"
              disabled={!enabled || saving}
              onClick={() => setDisableOpen(true)}
            >
              Disable
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#2F4156]/10 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-[#2F4156]/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6" />
              <h2 className="text-2xl font-semibold">Public key</h2>
            </div>
            {enabled && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#dff8c8] px-4 py-2 text-sm font-semibold text-[#15713b]">
                <CheckCircle2 className="size-4" />
                Installed
              </span>
            )}
          </div>

          <div className="p-6">
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
              {[
                ["1", "Create a key", createKeyCommand],
                ["2", "Copy the public key", showPublicKeyCommand],
                ["3", "Paste it below", "Enable SSH"],
              ].map(([step, title, command]) => (
                <div
                  key={step}
                  className="rounded-2xl border border-[#2F4156]/10 bg-[#F1F1F1] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-[#2F4156] text-sm font-semibold text-white">
                      {step}
                    </span>
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 font-mono text-xs text-[#2F4156]">
                    <span className="break-all">{command}</span>
                    {step !== "3" && (
                      <CopyButton value={command} label={`${title} command`} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Label htmlFor="public-key">Public key</Label>
            <textarea
              id="public-key"
              value={publicKey}
              onChange={(event) => setPublicKey(event.target.value)}
              placeholder="Paste the output of: cat ~/.ssh/berrypanel.pub"
              className="mt-3 min-h-36 w-full resize-y rounded-2xl border border-[#2F4156]/10 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-[#567C8D] focus:ring-4 focus:ring-[#567C8D]/10"
            />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                className="h-11 rounded-full bg-[#2F4156] px-6 text-white hover:bg-[#2F4156]/90"
                disabled={saving || publicKey.trim() === ""}
                onClick={enableSsh}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {enabled ? "Update SSH Key" : "Enable SSH"}
              </Button>
              <p className="text-sm text-[#567C8D]">
                BerryPanel installs this key on the server. The private key
                stays only on your own device.
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#2F4156]/10 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-[#2F4156]/10 px-6 py-5">
            <h2 className="text-2xl font-semibold">Log in to SSH</h2>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-[#567C8D]"
            >
              <ExternalLink className="size-4" />
              How to log in?
            </Button>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            <div className="p-6 lg:border-r lg:border-[#2F4156]/10">
              <h3 className="text-xl font-semibold">
                Use a built-in terminal on your device
              </h3>
              <p className="mt-4 text-base leading-6 text-[#567C8D]">
                After SSH is enabled, paste this command into your terminal.
              </p>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-[#C8D9E6] px-6 py-5 font-mono text-sm">
                <span className="break-all">{sshCommand}</span>
                <CopyButton value={sshCommand} label="SSH command" />
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold">Run Laravel commands</h3>
              <p className="mt-4 text-base leading-6 text-[#567C8D]">
                Go into your site folder, then run the commands your app needs.
              </p>
              <div className="mt-6 rounded-2xl bg-[#2F4156] p-5 font-mono text-sm leading-7 text-white">
                <p>cd sites/your-site</p>
                <p>php artisan migrate --force</p>
                <p>php artisan key:generate --force</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-[#F1F1F1] p-6">
          <div className="flex items-start gap-3">
            <Terminal className="mt-1 size-5 shrink-0" />
            <p className="text-sm leading-6 text-[#2F4156]">
              To connect, create a key, add the public key, copy the SSH command,
              then run the commands your application needs.
            </p>
          </div>
        </section>

      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable SSH access?</DialogTitle>
            <DialogDescription>
              This removes your current authorized key from the server. You can
              enable SSH again later by adding a new public key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisableOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={saving}
              onClick={disableSsh}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Disable SSH
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  );
}
