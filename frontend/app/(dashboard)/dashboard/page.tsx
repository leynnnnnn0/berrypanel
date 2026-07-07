"use client";

import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { StatusPill } from "@/components/dashboard/status-pill";
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
  formatBreakdownDetail,
  formatBytes,
  formatCount,
  formatRelativeTime,
  siteStatusLabel,
} from "@/lib/dashboard-formatters";
import type {
  CreateSiteResponse,
  DeployActivity,
  Site,
  SitesResponse,
  UsageResponse,
} from "@/types/dashboard";
import {
  CheckCircle2,
  Clock3,
  CloudUpload,
  ExternalLink,
  Folder,
  GitBranch,
  GitFork,
  Globe2,
  HardDrive,
  Loader2,
  Plus,
  ServerCog,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
    label: "Installing PHP dependencies",
    body: "Running Composer install for the Laravel runtime.",
  },
  {
    label: "Building frontend assets",
    body: "Installing npm packages and compiling the Inertia build.",
  },
  {
    label: "Preparing next steps",
    body: "Opening the site page so you can configure .env and database credentials.",
  },
];


export default function DashboardPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [usage, setUsage] = useState<UsageResponse["usage"] | null>(null);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);
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

  async function loadUsage() {
    setLoadingUsage(true);

    try {
      const response = await api<UsageResponse>("/api/usage");
      setUsage(response.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load usage");
    } finally {
      setLoadingUsage(false);
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
      void loadUsage();
      setSiteName("");
      setRepositoryUrl("");
      setRepositoryBranch("main");
      setSiteDialogOpen(false);
      router.push(`/dashboard/sites/${response.site.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create site";
      setCreateError(message);
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
    loadUsage();
  }, []);

  const storageUsed = usage ? formatBytes(usage.total_bytes) : loadingUsage ? "..." : "0 B";
  const storageQuota = usage ? formatBytes(usage.quota_bytes) : "25 GB";
  const storagePercent = usage ? usage.percent : 0;
  const visibleStoragePercent = usage && usage.total_bytes > 0 ? Math.max(1, storagePercent) : 0;
  const workspaceCountDetail = usage
    ? `${formatCount(usage.file_count, "file")} / ${formatCount(usage.directory_count, "folder")}`
    : loadingUsage
      ? "Scanning workspace"
      : "0 files / 0 folders";
  const storageBreakdown = [
    {
      label: "Application files",
      value: usage ? formatBytes(usage.breakdown.application.bytes) : loadingUsage ? "..." : "0 B",
      detail: formatBreakdownDetail(usage?.breakdown.application),
      icon: Folder,
    },
    {
      label: "Uploads",
      value: usage ? formatBytes(usage.breakdown.uploads.bytes) : loadingUsage ? "..." : "0 B",
      detail: formatBreakdownDetail(usage?.breakdown.uploads),
      icon: CloudUpload,
    },
    {
      label: "Backups",
      value: usage ? formatBytes(usage.breakdown.backups.bytes) : loadingUsage ? "..." : "0 B",
      detail: formatBreakdownDetail(usage?.breakdown.backups),
      icon: HardDrive,
    },
    {
      label: "Logs",
      value: usage ? formatBytes(usage.breakdown.logs.bytes) : loadingUsage ? "..." : "0 B",
      detail: formatBreakdownDetail(usage?.breakdown.logs),
      icon: Terminal,
    },
  ];

  const visibleSites = sites.map((site, index) => ({
    name: site.name,
    stack: `${site.stack} / PHP ${site.php_version}`,
    domain: site.local_url ?? "Pending local domain",
    repositoryUrl: site.repository_url,
    status: siteStatusLabel(site.status),
    branch: site.repository_branch ? site.repository_branch : "main",
    accent: index % 2 === 0 ? "bg-[#d8cef2]" : "bg-[#fff0b8]",
  }));
  const siteStorage = usage?.sites ?? [];
  const deploymentActivities = useMemo<DeployActivity[]>(() => {
    return sites
      .flatMap((site) => {
        const timestamp = site.updated_at ?? site.created_at;
        const items: DeployActivity[] = [
          {
            id: `${site.id}-created`,
            label: `${site.name} site provisioned`,
            detail: `${site.repository_branch || "main"} branch`,
            tone: "success",
            timestamp,
          },
        ];

        if (site.status === "needs_configuration") {
          items.unshift({
            id: `${site.id}-configuration`,
            label: `${site.name} needs .env setup`,
            detail: "Open the site page to finish database and runtime values",
            tone: "warning",
            timestamp,
          });
        }

        if (site.deployment_warnings.length > 0) {
          items.unshift({
            id: `${site.id}-warning`,
            label: `${site.name} deploy warning saved`,
            detail: site.deployment_warnings[0],
            tone: "warning",
            timestamp,
          });
        }

        return items;
      })
      .sort((left, right) => {
        const leftTime = left.timestamp ? new Date(left.timestamp).getTime() : 0;
        const rightTime = right.timestamp ? new Date(right.timestamp).getTime() : 0;

        return rightTime - leftTime;
      })
      .slice(0, 5);
  }, [sites]);

  const stats = useMemo(
    () => [
      {
        label: "Active Sites",
        value: loadingSites ? "..." : String(sites.length),
        detail: sites.length === 1 ? "site" : "sites",
      },
      {
        label: "Deployments",
        value: loadingSites ? "..." : String(deploymentActivities.length),
        detail: deploymentActivities.length === 1 ? "event" : "events",
      },
      { label: "Storage", value: storageUsed, detail: workspaceCountDetail },
      { label: "Databases", value: "0", detail: "coming soon" },
    ],
    [
      deploymentActivities.length,
      loadingSites,
      sites.length,
      storageUsed,
      workspaceCountDetail,
    ],
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
                  onClick={() => {
                    setCreateError("");
                    setSiteDialogOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  {creatingSite ? "Creating..." : "New Laravel Site"}
                </Button>
              </div>

              {error && !siteDialogOpen && (
                <p className="break-words rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 [overflow-wrap:anywhere]">
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
                  <p className="text-5xl font-semibold">{storageUsed}</p>
                  <p className="mt-2 text-sm text-[#4f4960]">
                    of {storageQuota} storage used
                  </p>
                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full bg-black transition-all"
                      style={{ width: `${Math.min(100, visibleStoragePercent)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#4f4960]">
                    {storagePercent}% used / {workspaceCountDetail}
                  </p>
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
              {loadingSites && (
                <div className="rounded-2xl bg-[#f7f7f7] p-4 text-sm text-[#777]">
                  Loading deployment activity...
                </div>
              )}

              {!loadingSites && deploymentActivities.length === 0 && (
                <div className="rounded-2xl bg-[#f7f7f7] p-4 text-sm text-[#777]">
                  No deploy activity yet. Create a Laravel site to start the
                  log.
                </div>
              )}

              {!loadingSites && deploymentActivities.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl bg-[#f7f7f7] p-4">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-white">
                    {item.tone === "warning" ? (
                      <Clock3 className="size-4 text-[#7b6415]" />
                    ) : (
                      <CheckCircle2 className="size-4 text-[#467a2d]" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 max-h-10 overflow-hidden break-words text-xs text-[#777] [overflow-wrap:anywhere]">
                      {item.detail}
                    </p>
                    <p className="mt-2 text-xs text-[#999]">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section>
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <SectionTitle eyebrow="Files" title="Storage Breakdown" />
            <div className="mt-6 space-y-4">
              {storageBreakdown.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-[#f7f7f7] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-white">
                      <item.icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-0.5 text-xs text-[#777]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-black/5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#151515]">
                  Sites using storage
                </h3>
                <span className="text-xs text-[#777]">
                  {formatCount(siteStorage.length, "site")}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {loadingUsage && (
                  <div className="rounded-2xl bg-[#f7f7f7] p-4 text-sm text-[#777]">
                    Scanning site folders...
                  </div>
                )}

                {!loadingUsage && siteStorage.length === 0 && (
                  <div className="rounded-2xl bg-[#f7f7f7] p-4 text-sm text-[#777]">
                    No site folders found for this workspace yet.
                  </div>
                )}

                {!loadingUsage && siteStorage.map((site) => (
                  <div
                    key={site.id}
                    className="rounded-2xl bg-[#f7f7f7] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {site.name}
                        </p>
                        <p className="mt-1 text-xs text-[#777]">
                          {formatBreakdownDetail(site)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm">
                        {formatBytes(site.bytes)}
                      </span>
                    </div>
                    {!site.exists && (
                      <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-[#8a6810]">
                        Folder missing on the server.
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-3xl overflow-hidden border-0 p-0 sm:max-h-[calc(100dvh-2rem)]">
          <form
            onSubmit={createLaravelSite}
            className="flex max-h-[calc(100dvh-1rem)] min-h-0 flex-col sm:max-h-[calc(100dvh-2rem)]"
          >
            <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white">
              <div className="shrink-0 bg-[#d8cef2] p-5 sm:p-6">
                <DialogHeader className="pr-10">
                  <span className="w-fit rounded-full bg-white/75 px-4 py-2 text-sm font-medium text-[#151515]">
                    Laravel Provisioning
                  </span>
                  <DialogTitle className="mt-5 text-4xl leading-none sm:text-5xl">
                    New Laravel Site
                  </DialogTitle>
                  <DialogDescription className="max-w-md text-[#4f4960]">
                    BerryPanel will create the site folder and pull the public
                    GitHub repository into your Raspberry Pi workspace.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
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
                          width: `${Math.min(92, Math.max(25, ((deployStep + 1) / deploySteps.length) * 100))}%`,
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
                  <p className="max-h-40 overflow-y-auto break-words rounded-2xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-600 [overflow-wrap:anywhere]">
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
                    onChange={(event) => {
                      setCreateError("");
                      setSiteName(event.target.value);
                    }}
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
                    onChange={(event) => {
                      setCreateError("");
                      setRepositoryUrl(event.target.value);
                    }}
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
                    onChange={(event) => {
                      setCreateError("");
                      setRepositoryBranch(event.target.value);
                    }}
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

                <div className="rounded-2xl border border-black/5 bg-[#fffaf0] p-4 text-sm leading-6 text-[#67551b]">
                  After deploy, BerryPanel opens the site page so you can create
                  or select a database, paste credentials into `.env`, and save
                  the Laravel runtime settings.
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
