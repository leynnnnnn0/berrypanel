"use client";

import { Button } from "@/components/ui/button";
import { CustomerServiceControls } from "@/components/hosting/customer-service-controls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  ExternalLink,
  FileKey2,
  GitBranch,
  GitFork,
  Globe2,
  Loader2,
  SendHorizontal,
  ServerCog,
  Terminal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

type EnvVariables = Record<string, string>;

type Site = {
  id: number;
  name: string;
  slug: string;
  stack: string;
  php_version: string;
  status: string;
  local_url: string | null;
  repository_url: string | null;
  repository_branch: string;
  deployment_warnings: string[];
  created_at: string | null;
  env_variables: EnvVariables;
};

type SiteResponse = {
  site: Site;
};

type Service = {
  id: number;
  type: string;
  name: string;
  status: string;
  enabled: boolean;
};

type SiteCommandResult = {
  command: string;
  exit_code: number | null;
  successful: boolean;
  output: string;
  ran_at: string;
};

type SiteCommandResponse = {
  result: SiteCommandResult;
  site: Site;
};

type TerminalLine = {
  id: number;
  kind: "input" | "output" | "error" | "system";
  text: string;
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
      : normalized === "deploying" || normalized === "needs_configuration"
        ? "bg-[#fff0b8] text-[#5c4b10]"
        : "bg-[#f4f4f4] text-[#555]";
  const label =
    normalized === "provisioned"
      ? "Provisioned"
      : normalized === "needs_configuration"
        ? "Needs configuration"
        : status;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {label}
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
  const [clearingWarnings, setClearingWarnings] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [commandRunning, setCommandRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function loadSite() {
      setLoading(true);
      setError("");

      try {
        const [response, serviceResponse] = await Promise.all([
          api<SiteResponse>(`/api/sites/${siteId}`),
          api<{ services: Service[] }>(`/api/sites/${siteId}/services`),
        ]);
        setSite(response.site);
        setVariables(response.site.env_variables ?? {});
        setServices(serviceResponse.services);
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

  async function clearDeploymentWarnings() {
    if (!site) {
      return;
    }

    setClearingWarnings(true);
    setError("");
    setSuccess("");

    try {
      const response = await api<SiteResponse>(
        `/api/sites/${site.id}/deployment-warnings`,
        { method: "DELETE" },
      );

      setSite(response.site);
      setVariables(response.site.env_variables ?? {});
      setSuccess("Deploy warning cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear warning");
    } finally {
      setClearingWarnings(false);
    }
  }

  function appendTerminalLine(kind: TerminalLine["kind"], text: string) {
    setTerminalLines((current) => [
      ...current,
      { id: Date.now() + current.length, kind, text },
    ]);
  }

  function openConsole() {
    setConsoleOpen(true);

    if (terminalLines.length === 0 && site) {
      setTerminalLines([
        {
          id: Date.now(),
          kind: "system",
          text: `Connected to ${site.slug}. Run Laravel Artisan maintenance commands here. Persistent features such as background jobs, realtime updates, and scheduled tasks are managed from Keep your application running.`,
        },
      ]);
    }
  }

  async function runConsoleCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!site || command.trim() === "") {
      return;
    }

    const value = command.trim();

    appendTerminalLine(
      "input",
      `user@${site.slug}:~/sites/${site.slug}$ ${value}`,
    );
    setCommand("");
    setCommandRunning(true);
    setError("");
    setSuccess("");

    try {
      const response = await api<SiteCommandResponse>(
        `/api/sites/${site.id}/commands`,
        {
          method: "POST",
          body: JSON.stringify({ command: value }),
        },
      );

      setSite(response.site);
      setVariables(response.site.env_variables ?? {});
      appendTerminalLine(
        response.result.successful ? "output" : "error",
        response.result.output,
      );

      if (response.result.successful) {
        setSuccess(`Command finished: ${response.result.command}`);
      } else {
        setError(`Command failed: ${response.result.command}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to run command";

      appendTerminalLine("error", message);
      setError(message);
    } finally {
      setCommandRunning(false);
    }
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
                Manage your application settings, deployment status, and
                database connection.
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
              <Button
                type="button"
                className="mt-2 h-11 rounded-full bg-black text-white hover:bg-black/85"
                onClick={openConsole}
              >
                <Terminal className="size-4" />
                Open terminal
              </Button>
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

        {site.deployment_warnings.length > 0 && (
          <section className="rounded-3xl border border-[#f4df9a] bg-[#fffaf0] p-5 text-[#6b5516] shadow-sm lg:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#171717]">
                  Deploy warning saved
                </h2>
                <p className="mt-2 text-sm leading-6">
                  BerryPanel saved this from the last automatic deploy. If you
                  already fixed it in SSH and the site works, clear the warning.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-full bg-white px-4"
                disabled={clearingWarnings}
                onClick={clearDeploymentWarnings}
              >
                {clearingWarnings ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Clear warning"
                )}
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {site.deployment_warnings.map((warning) => (
                <p
                  key={warning}
                  className="max-h-32 overflow-y-auto break-words rounded-2xl bg-white/75 px-4 py-3 text-sm leading-5 [overflow-wrap:anywhere]"
                >
                  {warning}
                </p>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-[#fff0b8] p-6 shadow-sm">
            <span className="grid size-10 place-items-center rounded-full bg-white/80">
              <Database className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">1. Create database</h2>
            <p className="mt-2 text-sm leading-6 text-[#66551c]">
              Create a MySQL database for this site, then copy the database
              name, username, and password.
            </p>
            <Button asChild className="mt-5 rounded-full bg-black text-white">
              <Link href="/dashboard/databases">Open databases</Link>
            </Button>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <span className="grid size-10 place-items-center rounded-full bg-[#d8cef2]">
              <FileKey2 className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">2. Configure .env</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">
              Paste app and database credentials below. BerryPanel writes them
              to this site&apos;s `.env` file on the Pi.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <span className="grid size-10 place-items-center rounded-full bg-[#dff8c8]">
              <CheckCircle2 className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">3. Finish runtime</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">
              After saving `.env`, the app has Composer dependencies, frontend
              assets, storage link, and app key prepared.
            </p>
          </div>
        </section>

        <CustomerServiceControls
          siteId={siteId}
          services={services}
          onChanged={(service) =>
            setServices((current) =>
              current.some((item) => item.id === service.id)
                ? current.map((item) => (item.id === service.id ? service : item))
                : [service, ...current],
            )
          }
        />

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center gap-3">
              <FileKey2 className="size-6" />
              <h2 className="text-2xl font-semibold">Environment file</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#666]">
              Your values are stored securely and are available only to this
              application.
            </p>
          </div>

          <div className="rounded-3xl bg-[#d8cef2] p-6 shadow-sm lg:p-8">
            <p className="text-xs font-medium uppercase text-[#5d5278]">
              Repository
            </p>
            <h2 className="mt-2 text-2xl font-semibold">GitHub deploy source</h2>
            <p className="mt-3 text-sm leading-6 text-[#4f4861]">
              BerryPanel uses the public repository connected during site
              creation. Future deployments use the selected branch.
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
              Changes are saved securely for this application.
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

      {consoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6">
          <section className="flex h-[min(760px,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-[#101010] shadow-2xl">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 text-white sm:px-6">
              <div>
                <p className="text-xs font-medium uppercase text-white/45">
                  BerryPanel terminal
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold">
                  <Terminal className="size-5" />
                  {site.name}
                </h2>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full text-white hover:bg-white/10 hover:text-white"
                onClick={() => setConsoleOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 font-mono text-sm sm:px-6">
              <div className="space-y-3">
                {terminalLines.map((line) => (
                  <pre
                    key={line.id}
                    className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 leading-6 [overflow-wrap:anywhere] ${
                      line.kind === "input"
                        ? "bg-white/5 text-[#98fb98]"
                        : line.kind === "error"
                          ? "bg-red-500/10 text-red-300"
                          : line.kind === "system"
                            ? "bg-[#d8cef2]/10 text-[#d8cef2]"
                            : "bg-white/[0.03] text-white/80"
                    }`}
                  >
                    {line.text}
                  </pre>
                ))}
                {commandRunning && (
                  <p className="inline-flex items-center gap-2 text-white/50">
                    <Loader2 className="size-4 animate-spin" />
                    Running command...
                  </p>
                )}
              </div>
            </div>

            <form
              className="border-t border-white/10 bg-black/30 p-3 sm:p-4"
              onSubmit={runConsoleCommand}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="shrink-0 font-mono text-sm text-[#98fb98]">
                  user@{site.slug}:~/sites/{site.slug}$
                </span>
                <Input
                  value={command}
                  disabled={commandRunning}
                  autoComplete="off"
                  placeholder="Type an approved command"
                  className="h-11 rounded-full border-white/10 bg-white/10 px-4 font-mono text-sm text-white placeholder:text-white/35 focus-visible:ring-white/30"
                  onChange={(event) => setCommand(event.target.value)}
                />
                <Button
                  type="submit"
                  disabled={commandRunning || command.trim() === ""}
                  className="h-11 rounded-full bg-white px-5 text-black hover:bg-white/90"
                >
                  {commandRunning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="size-4" />
                  )}
                  Run
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
