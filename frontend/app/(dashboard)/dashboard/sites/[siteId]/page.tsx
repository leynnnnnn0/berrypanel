"use client";

import { Button } from "@/components/ui/button";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { MetricCard } from "@/components/dashboard/metric-card";
import { availabilityDetail, availabilityLabel } from "@/components/dashboard/availability-pill";
import { CustomerServiceControls } from "@/components/hosting/customer-service-controls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ListChecks,
  SendHorizontal,
  ServerCog,
  Terminal,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import type { SiteAvailability } from "@/types/dashboard";
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
  availability: SiteAvailability;
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

const commonEnvironmentKeys = new Set(
  [...appFields, ...databaseFields, ...runtimeFields, ...mailFields].map((field) => field.key),
);

function siteAddress(url: string) {
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
}

function parseEnvironmentFile(content: string): EnvVariables {
  return content.split(/\r?\n/).reduce<EnvVariables>((variables, rawLine) => {
    const line = rawLine.trim().replace(/^export\s+/, "");

    if (!line || line.startsWith("#") || !line.includes("=")) {
      return variables;
    }

    const separator = line.indexOf("=");
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
      return variables;
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    variables[key] = value;
    return variables;
  }, {});
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
      <Label htmlFor={field.key} className="text-sm text-[#567C8D]">
        {field.label}
      </Label>
      <Input
        id={field.key}
        type={field.type ?? "text"}
        value={value ?? ""}
        placeholder={field.placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border-[#2F4156]/10 bg-white px-4 text-base"
      />
      <p className="font-mono text-[11px] uppercase text-[#567C8D]">{field.key}</p>
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
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#567C8D]">
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
  const [nextStepsOpen, setNextStepsOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [commandRunning, setCommandRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const additionalVariables = Object.entries(variables).filter(
    ([key]) => !commonEnvironmentKeys.has(key),
  );

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

  function initializeTerminal() {
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

  async function uploadEnvironment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const uploaded = parseEnvironmentFile(await file.text());
      const count = Object.keys(uploaded).length;

      if (count === 0) {
        throw new Error("The selected file does not contain valid environment values.");
      }

      setVariables((current) => ({ ...current, ...uploaded }));
      setError("");
      setSuccess(`${count} environment values loaded. Review them, then save changes.`);
    } catch (err) {
      setSuccess("");
      setError(err instanceof Error ? err.message : "Unable to read the environment file");
    } finally {
      event.target.value = "";
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
      <DashboardPage className="grid min-h-[50vh] place-items-center text-[#567C8D]">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Loading site...
        </span>
      </DashboardPage>
    );
  }

  if (!site) {
    return (
      <DashboardPage>
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-red-600">{error || "Site not found."}</p>
          <Button asChild className="mt-5 rounded-full bg-[#2F4156] text-white">
            <Link href="/dashboard/sites">
              <ArrowLeft className="size-4" />
              Back to sites
            </Link>
          </Button>
        </section>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow={`Laravel site · ${site.status}`}
        title={site.name}
        description="Manage application settings, deployment status, runtime services, and database connections from one workspace."
        icon={Globe2}
        contextLabel="Application address"
        contextValue={
          site.local_url ? (
            <a href={siteAddress(site.local_url)} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate hover:underline">
              <span className="truncate">{site.local_url}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : "Pending local URL"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-11 rounded-full border-white/20 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white">
              <Link href="/dashboard/sites"><ArrowLeft className="size-4" />Sites</Link>
            </Button>
            <Button type="button" className="h-11 rounded-full bg-white px-5 text-[#2F4156] hover:bg-white/90" onClick={() => setNextStepsOpen(true)}>
              <ListChecks className="size-4" />What&apos;s next
            </Button>
          </div>
        }
      />

      {(error || success) && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
          {error || success}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Application Services</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="terminal" onClick={initializeTerminal}>Terminal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Availability" value={availabilityLabel(site.availability)} detail={availabilityDetail(site.availability)} icon={Globe2} tone="slate" />
            <MetricCard label="Status" value={site.status} detail="deployment state" icon={ServerCog} tone="lavender" />
            <MetricCard label="Branch" value={site.repository_branch || "main"} detail="deployment source" icon={GitBranch} tone="sky" />
            <MetricCard label="PHP" value={site.php_version} detail="application runtime" icon={FileKey2} tone="mist" />
          </section>

          {site.deployment_warnings.length > 0 && (
            <section className="rounded-3xl bg-[#F5EFEB] p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Deployment needs attention</h2>
                  <p className="mt-2 text-sm leading-6 text-[#567C8D]">Review the saved warning. Clear it after the issue has been resolved.</p>
                </div>
                <Button type="button" variant="outline" className="rounded-full bg-white" disabled={clearingWarnings} onClick={clearDeploymentWarnings}>
                  {clearingWarnings ? <><Loader2 className="animate-spin" />Clearing...</> : "Clear warning"}
                </Button>
              </div>
              <div className="mt-4 grid gap-3">
                {site.deployment_warnings.map((warning) => <p key={warning} className="max-h-32 overflow-y-auto rounded-2xl bg-white p-4 text-sm">{warning}</p>)}
              </div>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
              <p className="text-xs font-medium uppercase text-[#567C8D]">Setup guide</p>
              <h2 className="mt-2 text-2xl font-semibold">Finish setting up your site</h2>
              <p className="mt-3 text-sm leading-6 text-[#567C8D]">Database, environment, and runtime guidance is available without taking over the page.</p>
              <Button type="button" className="mt-6 rounded-full bg-[#2F4156] text-white" onClick={() => setNextStepsOpen(true)}><ListChecks />View what&apos;s next</Button>
            </div>
            <div className="rounded-3xl bg-[#C8D9E6] p-6 shadow-sm lg:p-8">
              <p className="text-xs font-medium uppercase text-[#567C8D]">Repository</p>
              <h2 className="mt-2 text-2xl font-semibold">GitHub source</h2>
              <p className="mt-3 text-sm leading-6 text-[#567C8D]">Future deployments use the connected repository and {site.repository_branch || "main"} branch.</p>
              {site.repository_url && <Button asChild variant="outline" className="mt-6 rounded-full bg-white/80"><a href={site.repository_url} target="_blank" rel="noopener noreferrer"><GitFork />Open repository<ExternalLink /></a></Button>}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="services">
          <CustomerServiceControls
            siteId={siteId}
            services={services}
            onChanged={(service) => setServices((current) => current.some((item) => item.id === service.id) ? current.map((item) => item.id === service.id ? service : item) : [service, ...current])}
          />
        </TabsContent>

        <TabsContent value="environment" className="space-y-6">
          <section className="flex flex-col gap-4 rounded-3xl bg-[#C8D9E6] p-6 shadow-sm md:flex-row md:items-center md:justify-between lg:p-8">
            <div>
              <p className="text-xs font-medium uppercase text-[#567C8D]">Environment file</p>
              <h2 className="mt-2 text-2xl font-semibold">Configure your application</h2>
              <p className="mt-2 text-sm text-[#567C8D]">Edit common settings below or upload an existing .env file with additional values.</p>
            </div>
            <div>
              <Label htmlFor="environment-upload" className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 font-medium text-[#2F4156] shadow-sm hover:bg-white/90"><Upload className="size-4" />Upload .env file</Label>
              <Input id="environment-upload" type="file" accept=".env,text/plain" className="sr-only" onChange={uploadEnvironment} />
            </div>
          </section>

          <EnvSection title="App credentials" description="Set the Laravel runtime values your application reads from APP_* and logging variables." fields={appFields} variables={variables} setVariable={setVariable} />
          <EnvSection title="Database credentials" description="Use the database name, user, and password created for this site." fields={databaseFields} variables={variables} setVariable={setVariable} />
          <EnvSection title="Runtime services" description="Control cache, queue, and session drivers for the application." fields={runtimeFields} variables={variables} setVariable={setVariable} />
          <EnvSection title="Mail credentials" description="Optional configuration for password resets, notifications, and application email." fields={mailFields} variables={variables} setVariable={setVariable} />

          {additionalVariables.length > 0 && (
            <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
              <h2 className="text-2xl font-semibold">Additional environment values</h2>
              <p className="mt-2 text-sm leading-6 text-[#567C8D]">These application-specific values were loaded from your environment file.</p>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {additionalVariables.map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`custom-${key}`} className="font-mono text-xs text-[#567C8D]">{key}</Label>
                    <Input id={`custom-${key}`} type={/(password|secret|token|key)/i.test(key) ? "password" : "text"} value={value} autoComplete="off" className="h-12 rounded-2xl" onChange={(event) => setVariable(key, event.target.value)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <span className="inline-flex items-center gap-2 text-sm text-[#567C8D]"><CheckCircle2 className="size-4" />Changes are stored securely for this application.</span>
            <Button type="button" className="h-12 rounded-full bg-[#2F4156] px-6 text-white" disabled={saving} onClick={saveEnvironment}>
              {saving ? <><Loader2 className="animate-spin" />Saving...</> : "Save environment"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="terminal">
          <section className="flex h-[620px] max-h-[70vh] flex-col overflow-hidden rounded-3xl bg-[#2F4156] shadow-xl">
            <header className="border-b border-white/10 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">BerryPanel terminal</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold"><Terminal className="size-5" />{site.name}</h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5 font-mono text-sm">
              <div className="space-y-3">
                {terminalLines.map((line) => <pre key={line.id} className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 leading-6 ${line.kind === "input" ? "bg-white/5 text-[#98fb98]" : line.kind === "error" ? "bg-red-500/10 text-red-300" : line.kind === "system" ? "bg-[#C8D9E6]/10 text-[#C8D9E6]" : "bg-white/[0.03] text-white/80"}`}>{line.text}</pre>)}
                {commandRunning && <p className="inline-flex items-center gap-2 text-white/50"><Loader2 className="animate-spin" />Running command...</p>}
              </div>
            </div>
            <form className="border-t border-white/10 p-4" onSubmit={runConsoleCommand}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="shrink-0 font-mono text-sm text-[#98fb98]">user@{site.slug}:~/sites/{site.slug}$</span>
                <Input value={command} disabled={commandRunning} autoComplete="off" placeholder="Type an approved command" className="h-11 rounded-full border-white/10 bg-white/10 px-4 font-mono text-sm text-white placeholder:text-white/35" onChange={(event) => setCommand(event.target.value)} />
                <Button type="submit" disabled={commandRunning || command.trim() === ""} className="h-11 rounded-full bg-white px-5 text-[#2F4156]">{commandRunning ? <Loader2 className="animate-spin" /> : <SendHorizontal />}Run</Button>
              </div>
            </form>
          </section>
        </TabsContent>
      </Tabs>

      <Sheet open={nextStepsOpen} onOpenChange={setNextStepsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 sm:max-w-lg">
          <SheetHeader className="bg-[#C8D9E6] p-7 pr-14 text-left">
            <SheetTitle className="text-3xl font-semibold text-[#2F4156]">What&apos;s next</SheetTitle>
            <SheetDescription>Complete these steps when your site needs its initial configuration.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 p-6">
            <div className="rounded-2xl bg-[#F5EFEB] p-5"><span className="grid size-10 place-items-center rounded-full bg-white"><Database /></span><h3 className="mt-4 font-semibold">1. Create a database</h3><p className="mt-2 text-sm leading-6 text-[#567C8D]">Create a database, then copy its name, username, and password.</p><Button asChild className="mt-4 rounded-full"><Link href="/dashboard/databases">Open databases</Link></Button></div>
            <div className="rounded-2xl bg-[#F5EFEB] p-5"><span className="grid size-10 place-items-center rounded-full bg-white"><FileKey2 /></span><h3 className="mt-4 font-semibold">2. Configure the environment</h3><p className="mt-2 text-sm leading-6 text-[#567C8D]">Use the Environment tab to enter values or upload your existing .env file.</p></div>
            <div className="rounded-2xl bg-[#F5EFEB] p-5"><span className="grid size-10 place-items-center rounded-full bg-white"><CheckCircle2 /></span><h3 className="mt-4 font-semibold">3. Verify the application</h3><p className="mt-2 text-sm leading-6 text-[#567C8D]">Save the environment, check the site address, and review any deployment warning.</p></div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardPage>
  );
}
