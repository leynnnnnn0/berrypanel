"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CloudUpload,
  Database,
  ExternalLink,
  Folder,
  GitBranch,
  GitFork,
  Globe2,
  HardDrive,
  KeyRound,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  Plus,
  ServerCog,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
};

type SitesResponse = {
  sites: Site[];
};

type CreateSiteResponse = {
  site: Site;
};

const activities = [
  "default deployed successfully",
  "database default_db migrated",
  "storage link refreshed",
  "pending DNS check for client-portal",
];

const deploySteps = [
  {
    label: "Preparing workspace",
    body: "Creating the Linux user site folder and permissions.",
  },
  {
    label: "Cloning repository",
    body: "Pulling the public GitHub repository and selected branch.",
  },
  {
    label: "Creating Laravel folders",
    body: "Ensuring public, storage, logs, and backup paths exist.",
  },
  {
    label: "Saving site",
    body: "Registering the site in your BerryPanel dashboard.",
  },
];

function StatusPill({ children }: { children: string }) {
  const normalized = children.toLowerCase();
  const tone =
    normalized === "online" || normalized === "provisioned"
      ? "bg-[#dff8c8] text-[#2c4a1f]"
      : normalized === "deploying"
        ? "bg-[#fff0b8] text-[#5c4b10]"
        : "bg-[#f4f4f4] text-[#555]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-[#8a8a8a]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-[#151515]">
        {title}
      </h2>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-sm text-[#777]">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <span className="text-3xl font-semibold text-[#151515]">
          {value}
        </span>
        <span className="rounded-full bg-[#f4f4f4] px-3 py-1 text-xs text-[#555]">
          {detail}
        </span>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Database;
  title: string;
  body: string;
  action: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-full bg-[#d8cef2] text-[#171717]">
          <Icon className="size-5" />
        </span>
        <ArrowUpRight className="size-5 text-[#777]" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-[#666]">{body}</p>
      <button className="mt-5 rounded-full border border-[#777] px-4 py-2 text-sm text-[#202020]">
        {action}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [creatingSite, setCreatingSite] = useState(false);
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositoryBranch, setRepositoryBranch] = useState("main");
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [deployStep, setDeployStep] = useState(0);

  async function loadSites() {
    setLoadingSites(true);
    setError("");

    try {
      const response = await api<SitesResponse>("/api/sites");
      setSites(response.sites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sites");
    } finally {
      setLoadingSites(false);
    }
  }

  async function createLaravelSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingSite(true);
    setError("");
    setCreateError("");
    setDeployStep(0);

    try {
      const response = await api<CreateSiteResponse>("/api/sites", {
        method: "POST",
        body: JSON.stringify({
          name: siteName,
          repository_url: repositoryUrl,
          repository_branch: repositoryBranch,
          php_version: "8.4",
        }),
      });

      setSites((current) => [response.site, ...current]);
      setSiteName("");
      setRepositoryUrl("");
      setRepositoryBranch("main");
      setSiteDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create site";
      setCreateError(message);
      setError(message);
    } finally {
      setCreatingSite(false);
    }
  }

  useEffect(() => {
    if (!creatingSite) {
      return;
    }

    const interval = window.setInterval(() => {
      setDeployStep((current) => Math.min(current + 1, deploySteps.length - 1));
    }, 2600);

    return () => window.clearInterval(interval);
  }, [creatingSite]);

  useEffect(() => {
    loadSites();
  }, []);

  const visibleSites = sites.map((site, index) => ({
    name: site.name,
    stack: `${site.stack} / PHP ${site.php_version}`,
    domain: site.local_url ?? "Pending local domain",
    repositoryUrl: site.repository_url,
    status: site.status === "provisioned" ? "Provisioned" : site.status,
    branch: site.repository_branch ? site.repository_branch : "main",
    accent: index % 2 === 0 ? "bg-[#d8cef2]" : "bg-[#fff0b8]",
  }));

  const stats = useMemo(
    () => [
      {
        label: "Active Sites",
        value: loadingSites ? "..." : String(sites.length),
        detail: sites.length === 1 ? "site" : "sites",
      },
      { label: "Deployments", value: "0", detail: "coming soon" },
      { label: "Storage", value: "0GB", detail: "tracked soon" },
      { label: "Databases", value: "0", detail: "coming soon" },
    ],
    [loadingSites, sites.length],
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#121212]">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <section className="overflow-hidden rounded-3xl bg-white">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_380px] lg:p-8">
            <div className="flex flex-col justify-between gap-10">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-[#d8cef2] px-4 py-2 text-sm font-medium">
                    Customer Workspace
                  </span>
                  <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.95] md:text-7xl">
                    My Hosting
                  </h1>
                  <p className="mt-5 max-w-xl text-lg leading-6 text-[#666]">
                    Manage your Laravel sites, deployments, domains, databases,
                    and server access from one focused panel.
                  </p>
                </div>
                <Button
                  className="h-12 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/85"
                  disabled={creatingSite}
                  onClick={() => setSiteDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  {creatingSite ? "Creating..." : "New Laravel Site"}
                </Button>
              </div>

              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-4">
                {stats.map((stat) => (
                  <MetricCard key={stat.label} {...stat} />
                ))}
              </div>
            </div>

            <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-[#d8cef2] p-6">
              <div className="absolute -bottom-20 left-8 text-[180px] font-bold leading-none text-white/55">
                BP
              </div>
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white px-4 py-2 text-sm">
                    Plan Usage
                  </span>
                  <ServerCog className="size-6" />
                </div>
                <div>
                  <p className="text-5xl font-semibold">18.4GB</p>
                  <p className="mt-2 text-sm text-[#4f4960]">
                    of 50GB storage used
                  </p>
                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/70">
                    <div className="h-full w-[37%] rounded-full bg-black" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {["PHP 8.4", "MariaDB", "SSL"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white/80 px-3 py-2 text-center"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <SectionTitle eyebrow="Sites" title="Active Laravel Sites" />
              <Link
                href="/dashboard/sites"
                className="rounded-full border border-[#777] px-4 py-2 text-sm"
              >
                View all
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
              <div className="hidden grid-cols-[1.15fr_1.2fr_1fr_0.7fr_0.6fr] bg-[#f7f7f7] px-5 py-3 text-xs font-medium uppercase text-[#777] md:grid">
                <span>Site</span>
                <span>GitHub</span>
                <span>Domain</span>
                <span>Status</span>
                <span>Branch</span>
              </div>
              {loadingSites && (
                <div className="border-t border-black/5 px-5 py-6 text-sm text-[#777]">
                  Loading your sites...
                </div>
              )}

              {!loadingSites && visibleSites.length === 0 && (
                <div className="border-t border-black/5 px-5 py-6 text-sm text-[#777]">
                  No Laravel sites yet. Create your first site to provision its
                  Linux folder.
                </div>
              )}

              {!loadingSites && visibleSites.map((site) => (
                <div
                  key={site.name}
                  className="flex flex-col gap-3 border-t border-black/5 px-5 py-4 text-sm md:grid md:grid-cols-[1.15fr_1.2fr_1fr_0.7fr_0.6fr] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-10 place-items-center rounded-xl ${site.accent}`}
                    >
                      <Globe2 className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-xs text-[#777]">{site.stack}</p>
                    </div>
                  </div>
                  {site.repositoryUrl ? (
                    <a
                      href={site.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-2 text-[#555] hover:text-black"
                    >
                      <GitFork className="size-4 shrink-0" />
                      <span className="truncate">
                        {site.repositoryUrl.replace("https://github.com/", "")}
                      </span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#777]">No repository</span>
                  )}
                  <span className="break-words text-[#555]">
                    {site.domain}
                  </span>
                  <div>
                    <StatusPill>{site.status}</StatusPill>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[#555]">
                    <GitBranch className="size-4" />
                    {site.branch}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <SectionTitle eyebrow="Activity" title="Latest Deploy Log" />
            <div className="mt-6 space-y-3">
              {activities.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-[#f7f7f7] p-4">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-white">
                    {index === 3 ? (
                      <Clock3 className="size-4 text-[#7b6415]" />
                    ) : (
                      <CheckCircle2 className="size-4 text-[#467a2d]" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item}</p>
                    <p className="mt-1 text-xs text-[#777]">
                      {index + 1} min ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="grid gap-6 lg:grid-cols-4">
          <ActionCard
            icon={Database}
            title="Database"
            body="default_db is connected and ready for migrations."
            action="View credentials"
          />
          <ActionCard
            icon={Terminal}
            title="SFTP Access"
            body="Upload files with your assigned Linux hosting user."
            action="Open guide"
          />
          <ActionCard
            icon={LockKeyhole}
            title="Domain Status"
            body="One domain is live, one site is waiting for DNS."
            action="Manage domains"
          />
          <ActionCard
            icon={LifeBuoy}
            title="Support"
            body="Need a queue, Reverb, or deploy issue checked?"
            action="Create ticket"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <SectionTitle eyebrow="Files" title="Storage Breakdown" />
            <div className="mt-6 space-y-4">
              {[
                { label: "Application files", value: "8.2GB", icon: Folder },
                { label: "Uploads", value: "6.8GB", icon: CloudUpload },
                { label: "Backups", value: "3.4GB", icon: HardDrive },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-[#f7f7f7] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-white">
                      <item.icon className="size-5" />
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#fff0b8] p-6 shadow-sm lg:p-8">
            <div className="flex items-start justify-between gap-5">
              <SectionTitle eyebrow="Security" title="Access Details" />
              <KeyRound className="size-7" />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["SSH host", "192.168.254.117"],
                ["Username", "demo"],
                ["Root path", "/srv/berrypanel/users/demo"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs uppercase text-[#8a7840]">{label}</p>
                  <p className="mt-3 break-words text-sm font-medium">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Dialog
        open={siteDialogOpen}
        onOpenChange={(open) => {
          if (!creatingSite) {
            setSiteDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-xl border-0 p-0">
          <form onSubmit={createLaravelSite}>
            <div className="overflow-hidden rounded-3xl bg-white">
              <div className="bg-[#d8cef2] p-6">
                <DialogHeader className="pr-10">
                  <span className="w-fit rounded-full bg-white/75 px-4 py-2 text-sm font-medium text-[#151515]">
                    Laravel Provisioning
                  </span>
                  <DialogTitle className="mt-5 text-4xl leading-none">
                    New Laravel Site
                  </DialogTitle>
                  <DialogDescription className="max-w-md text-[#4f4960]">
                    BerryPanel will create the site folder and pull the public
                    GitHub repository into your Raspberry Pi workspace.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-5 p-6">
                {creatingSite && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-[#ded8f3] bg-[#f7f3ff]"
                  >
                    <div className="flex items-start gap-4 p-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#171717] shadow-sm">
                        <Loader2 className="size-5 animate-spin" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#171717]">
                          Deploying your Laravel site
                        </p>
                        <p className="mt-1 text-sm leading-5 text-[#6b6478]">
                          Keep this window open while BerryPanel talks to GitHub.
                          Public repositories usually finish in under a minute.
                        </p>
                      </div>
                    </div>
                    <div className="h-1 bg-white">
                      <motion.div
                        className="h-full bg-[#d8cef2]"
                        initial={{ width: "15%" }}
                        animate={{
                          width: `${Math.max(25, ((deployStep + 1) / deploySteps.length) * 100)}%`,
                        }}
                        transition={{ duration: 0.35 }}
                      />
                    </div>
                    <div className="grid gap-3 p-4 pt-3">
                      {deploySteps.map((step, index) => {
                        const isDone = index < deployStep;
                        const isActive = index === deployStep;

                        return (
                          <div
                            key={step.label}
                            className="flex items-start gap-3 rounded-2xl bg-white/65 p-3"
                          >
                            <span
                              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                                isDone
                                  ? "bg-[#dff8c8] text-[#2c4a1f]"
                                  : isActive
                                    ? "bg-[#171717] text-white"
                                    : "bg-white text-[#8a8495]"
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="size-4" />
                              ) : isActive ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <span className="size-2 rounded-full bg-current" />
                              )}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[#171717]">
                                {step.label}
                              </p>
                              <p className="text-xs leading-5 text-[#6b6478]">
                                {step.body}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {createError && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                    {createError}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="site-name" className="text-[#333]">
                    Site name
                  </Label>
                  <Input
                    id="site-name"
                    value={siteName}
                    onChange={(event) => setSiteName(event.target.value)}
                    placeholder="my-laravel-site"
                    pattern="[A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9]"
                    required
                    disabled={creatingSite}
                    className="h-14 rounded-full border-[#d8d8d8] bg-[#f7f7f7] px-5 text-base"
                  />
                  <p className="text-xs leading-5 text-[#777]">
                    Use letters, numbers, spaces, or hyphens. We will convert it
                    into a safe folder name.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repository-url" className="text-[#333]">
                    Public GitHub URL
                  </Label>
                  <Input
                    id="repository-url"
                    type="url"
                    value={repositoryUrl}
                    onChange={(event) => setRepositoryUrl(event.target.value)}
                    placeholder="https://github.com/user/laravel-app"
                    pattern="https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(\.git)?"
                    required
                    disabled={creatingSite}
                    className="h-14 rounded-full border-[#d8d8d8] bg-[#f7f7f7] px-5 text-base"
                  />
                  <p className="text-xs leading-5 text-[#777]">
                    For now, only public GitHub repositories are supported.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repository-branch" className="text-[#333]">
                    Branch
                  </Label>
                  <Input
                    id="repository-branch"
                    value={repositoryBranch}
                    onChange={(event) =>
                      setRepositoryBranch(event.target.value)
                    }
                    placeholder="main"
                    pattern="[A-Za-z0-9._/-]+"
                    required
                    disabled={creatingSite}
                    className="h-14 rounded-full border-[#d8d8d8] bg-[#f7f7f7] px-5 text-base"
                  />
                </div>

                <div className="grid gap-3 rounded-2xl bg-[#f7f7f7] p-4 text-sm text-[#555] md:grid-cols-3">
                  <div>
                    <p className="font-medium text-[#151515]">Stack</p>
                    <p>Laravel / Inertia</p>
                  </div>
                  <div>
                    <p className="font-medium text-[#151515]">PHP</p>
                    <p>8.4</p>
                  </div>
                  <div>
                    <p className="font-medium text-[#151515]">Folders</p>
                    <p>public, storage, logs</p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full px-5"
                    onClick={() => setSiteDialogOpen(false)}
                    disabled={creatingSite}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/85"
                    disabled={creatingSite}
                  >
                    {creatingSite ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      "Create site"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
