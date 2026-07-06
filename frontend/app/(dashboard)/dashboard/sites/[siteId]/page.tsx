"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileKey2,
  GitBranch,
  GitFork,
  Globe2,
  Loader2,
  ServerCog,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type EnvVariables = Record<string, string>;

type Site = {
  id: number;
  name: string;
  slug: string;
  stack: string;
  php_version: string;
  status: string;
  root_path: string;
  public_path: string;
  local_url: string | null;
  repository_url: string | null;
  repository_branch: string;
  created_at: string | null;
  env_variables: EnvVariables;
};

type SiteResponse = {
  site: Site;
};

const appFields = [
  { key: "APP_NAME", label: "App name", placeholder: "My Laravel App" },
  { key: "APP_ENV", label: "App environment", placeholder: "production" },
  { key: "APP_KEY", label: "App key", placeholder: "base64:..." },
  { key: "APP_DEBUG", label: "Debug mode", placeholder: "false" },
  { key: "APP_URL", label: "App URL", placeholder: "https://example.com" },
  { key: "LOG_CHANNEL", label: "Log channel", placeholder: "stack" },
];

const databaseFields = [
  { key: "DB_CONNECTION", label: "Database driver", placeholder: "mysql" },
  { key: "DB_HOST", label: "Database host", placeholder: "127.0.0.1" },
  { key: "DB_PORT", label: "Database port", placeholder: "3306" },
  { key: "DB_DATABASE", label: "Database name", placeholder: "site_db" },
  { key: "DB_USERNAME", label: "Database username", placeholder: "site_user" },
  {
    key: "DB_PASSWORD",
    label: "Database password",
    placeholder: "Paste database password",
    type: "password",
  },
];

const runtimeFields = [
  { key: "CACHE_STORE", label: "Cache store", placeholder: "database" },
  { key: "QUEUE_CONNECTION", label: "Queue connection", placeholder: "database" },
  { key: "SESSION_DRIVER", label: "Session driver", placeholder: "database" },
];

const mailFields = [
  { key: "MAIL_MAILER", label: "Mail driver", placeholder: "log" },
  { key: "MAIL_HOST", label: "Mail host", placeholder: "smtp.mailtrap.io" },
  { key: "MAIL_PORT", label: "Mail port", placeholder: "2525" },
  { key: "MAIL_USERNAME", label: "Mail username", placeholder: "username" },
  {
    key: "MAIL_PASSWORD",
    label: "Mail password",
    placeholder: "Paste mail password",
    type: "password",
  },
  {
    key: "MAIL_FROM_ADDRESS",
    label: "From email",
    placeholder: "hello@example.com",
  },
  { key: "MAIL_FROM_NAME", label: "From name", placeholder: "BerryPanel" },
];

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "online" || normalized === "provisioned"
      ? "bg-[#dff8c8] text-[#2c4a1f]"
      : normalized === "deploying"
        ? "bg-[#fff0b8] text-[#5c4b10]"
        : "bg-[#f4f4f4] text-[#555]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {status === "provisioned" ? "Provisioned" : status}
    </span>
  );
}

function EnvField({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string; placeholder: string; type?: string };
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key} className="text-sm text-[#555]">
        {field.label}
      </Label>
      <Input
        id={field.key}
        type={field.type ?? "text"}
        value={value ?? ""}
        placeholder={field.placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border-black/10 bg-white px-4 text-base"
      />
      <p className="font-mono text-[11px] uppercase text-[#999]">{field.key}</p>
    </div>
  );
}

function EnvSection({
  title,
  description,
  fields,
  variables,
  setVariable,
}: {
  title: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  variables: EnvVariables;
  setVariable: (key: string, value: string) => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666]">
          {description}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <EnvField
            key={field.key}
            field={field}
            value={variables[field.key] ?? ""}
            onChange={(value) => setVariable(field.key, value)}
          />
        ))}
      </div>
    </section>
  );
}

export default function SiteShowPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params.siteId;
  const [site, setSite] = useState<Site | null>(null);
  const [variables, setVariables] = useState<EnvVariables>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSite() {
      setLoading(true);
      setError("");

      try {
        const response = await api<SiteResponse>(`/api/sites/${siteId}`);
        setSite(response.site);
        setVariables(response.site.env_variables ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load site");
      } finally {
        setLoading(false);
      }
    }

    if (siteId) {
      loadSite();
    }
  }, [siteId]);

  const envPreviewPath = useMemo(
    () => (site ? `${site.root_path}/.env` : ""),
    [site],
  );

  function setVariable(key: string, value: string) {
    setVariables((current) => ({ ...current, [key]: value }));
    setSuccess("");
  }

  async function saveEnvironment() {
    if (!site) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api<SiteResponse>(`/api/sites/${site.id}/env`, {
        method: "PUT",
        body: JSON.stringify({ variables }),
      });

      setSite(response.site);
      setVariables(response.site.env_variables ?? {});
      setSuccess("Environment saved and .env file updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save environment",
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f5f5] text-[#555]">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Loading site...
        </span>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] p-6 text-[#121212]">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-red-600">{error || "Site not found."}</p>
          <Button asChild className="mt-5 rounded-full bg-black text-white">
            <Link href="/dashboard/sites">
              <ArrowLeft className="size-4" />
              Back to sites
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#121212]">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-full px-4"
              >
                <Link href="/dashboard/sites">
                  <ArrowLeft className="size-4" />
                  Sites
                </Link>
              </Button>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-[#d8cef2] px-4 py-2 text-sm font-medium">
                  Laravel Site
                </span>
                <StatusPill status={site.status} />
              </div>
              <h1 className="mt-5 text-5xl font-semibold leading-none md:text-7xl">
                {site.name}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-6 text-[#666]">
                Manage the Laravel environment credentials BerryPanel writes to
                this site folder on your Raspberry Pi server.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl bg-[#f7f7f7] p-4 text-sm text-[#555] xl:min-w-[420px]">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="size-4" />
                  Local URL
                </span>
                <span className="text-right font-medium text-[#151515]">
                  {site.local_url ?? "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2">
                  <GitBranch className="size-4" />
                  Branch
                </span>
                <span className="font-medium text-[#151515]">
                  {site.repository_branch || "main"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2">
                  <ServerCog className="size-4" />
                  PHP
                </span>
                <span className="font-medium text-[#151515]">
                  {site.php_version}
                </span>
              </div>
            </div>
          </div>
        </section>

        {(error || success) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
            }`}
          >
            {error || success}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center gap-3">
              <FileKey2 className="size-6" />
              <h2 className="text-2xl font-semibold">Environment file</h2>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-black/5 bg-[#f7f7f7] p-4">
                <p className="text-xs font-medium uppercase text-[#888]">
                  Writes to
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="break-all font-mono text-sm text-[#333]">
                    {envPreviewPath}
                  </p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0 rounded-full"
                    onClick={() => copyText(envPreviewPath)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#f7f7f7] p-4">
                <p className="text-xs font-medium uppercase text-[#888]">
                  Public path
                </p>
                <p className="mt-2 break-all font-mono text-sm text-[#333]">
                  {site.public_path}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#d8cef2] p-6 shadow-sm lg:p-8">
            <p className="text-xs font-medium uppercase text-[#5d5278]">
              Repository
            </p>
            <h2 className="mt-2 text-2xl font-semibold">GitHub deploy source</h2>
            <p className="mt-3 text-sm leading-6 text-[#4f4861]">
              BerryPanel uses the public repository connected during site
              creation. The deploy flow will pull this branch into the site
              folder.
            </p>
            {site.repository_url && (
              <Button
                asChild
                variant="outline"
                className="mt-6 h-11 rounded-full bg-white/70 px-5"
              >
                <a
                  href={site.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitFork className="size-4" />
                  Open repository
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </section>

        <EnvSection
          title="App credentials"
          description="Set the Laravel runtime values your application reads from APP_* and logging variables."
          fields={appFields}
          variables={variables}
          setVariable={setVariable}
        />

        <EnvSection
          title="Database credentials"
          description="Use the database name, user, and password provisioned for this site. These values are saved into the site's .env file."
          fields={databaseFields}
          variables={variables}
          setVariable={setVariable}
        />

        <EnvSection
          title="Runtime services"
          description="Control cache, queue, and session drivers for Laravel, Inertia, queues, and background jobs."
          fields={runtimeFields}
          variables={variables}
          setVariable={setVariable}
        />

        <EnvSection
          title="Mail credentials"
          description="Optional SMTP or logging configuration for password resets, notifications, and app emails."
          fields={mailFields}
          variables={variables}
          setVariable={setVariable}
        />

        <div className="sticky bottom-0 -mx-0 border-t border-black/5 bg-[#f5f5f5]/90 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <span className="inline-flex items-center gap-2 text-sm text-[#666]">
              <CheckCircle2 className="size-4 text-[#7a5cff]" />
              Changes are saved to BerryPanel and written to the server .env
              file.
            </span>
            <Button
              type="button"
              className="h-12 rounded-full bg-black px-6 text-white hover:bg-black/85"
              disabled={saving}
              onClick={saveEnvironment}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save .env credentials"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
