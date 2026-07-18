"use client";

import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardPage as DashboardPageShell } from "@/components/dashboard/dashboard-page";
import { SectionTitle } from "@/components/dashboard/section-title";
import { StatusPill } from "@/components/dashboard/status-pill";
import { AvailabilityPill } from "@/components/dashboard/availability-pill";
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
  Database,
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
    body: "Preparing your application workspace.",
  },
  {
    label: "Cloning repository",
    body: "Pulling the public GitHub repository and selected branch.",
  },
  {
    label: "Preparing application storage",
    body: "Setting up the files and settings your application needs.",
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

type DatabasesResponse = {
  databases: Array<{ id: number }>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [usage, setUsage] = useState<UsageResponse["usage"] | null>(null);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [databaseCount, setDatabaseCount] = useState(0);
  const [loadingDatabases, setLoadingDatabases] = useState(true);
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

  async function loadDatabases() {
    setLoadingDatabases(true);

    try {
      const response = await api<DatabasesResponse>("/api/databases");
      setDatabaseCount(response.databases.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load databases");
    } finally {
      setLoadingDatabases(false);
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
    loadDatabases();
  }, []);

  const storageUsed = usage ? formatBytes(usage.total_bytes) : loadingUsage ? "..." : "0 B";
  const storageQuota = usage ? formatBytes(usage.quota_bytes) : "1.2 GB";
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
    domainUrl: site.local_url
      ? (/^https?:\/\//i.test(site.local_url) ? site.local_url : `http://${site.local_url}`)
      : null,
    repositoryUrl: site.repository_url,
    status: siteStatusLabel(site.status),
    availability: site.availability,
    branch: site.repository_branch ? site.repository_branch : "main",
    accent: index % 2 === 0 ? "bg-[#C8D9E6]" : "bg-[#F1F1F1]",
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
        label: "Online Sites",
        value: loadingSites
          ? "..."
          : String(sites.filter((site) => site.availability.status === "online").length),
        detail: loadingSites ? "checking availability" : `${sites.length} hosted`,
      },
      {
        label: "Deployments",
        value: loadingSites ? "..." : String(deploymentActivities.length),
        detail: deploymentActivities.length === 1 ? "event" : "events",
      },
      { label: "Storage", value: storageUsed, detail: workspaceCountDetail },
      {
        label: "Databases",
        value: loadingDatabases ? "..." : String(databaseCount),
        detail: databaseCount === 1 ? "configured database" : "configured databases",
      },
    ],
    [
      deploymentActivities.length,
      databaseCount,
      loadingDatabases,
      loadingSites,
      sites,
      storageUsed,
      workspaceCountDetail,
    ],
  );

  return (
    <DashboardPageShell>
        <DashboardHero
          eyebrow="BerryPanel workspace · Live overview"
          title="My hosting at a glance."
          description="Manage Laravel sites, deployments, domains, databases, and account access from one focused panel."
          icon={ServerCog}
          contextLabel="Plan usage"
          contextValue={`${storageUsed} of ${storageQuota}`}
          action={
            <Button
              className="h-12 rounded-full bg-white px-5 text-sm font-semibold text-[#2F4156] hover:bg-white/90"
              disabled={creatingSite}
              onClick={() => {
                setCreateError("");
                setSiteDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              {creatingSite ? "Creating..." : "New Laravel Site"}
            </Button>
          }
        />

        {error && !siteDialogOpen && (
          <p className="break-words rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 [overflow-wrap:anywhere]">
            {error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const visuals = [
              { icon: Globe2, tone: "lavender" as const, eyebrow: "Hosting activity" },
              { icon: GitBranch, tone: "sky" as const, eyebrow: "Deployment activity" },
              { icon: HardDrive, tone: "mist" as const, eyebrow: "Plan usage" },
              { icon: Database, tone: "slate" as const, eyebrow: "Data services" },
            ][index];

            return <MetricCard key={stat.label} {...stat} {...visuals} />;
          })}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <SectionTitle eyebrow="Sites" title="Hosted Sites" />
              <Link
                href="/dashboard/sites"
                className="rounded-full border border-[#567C8D] px-4 py-2 text-sm"
              >
                View all
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#2F4156]/5">
              <div className="hidden grid-cols-[1.1fr_1.15fr_.9fr_.7fr_.7fr_.55fr] bg-[#F1F1F1] px-5 py-3 text-xs font-medium uppercase text-[#567C8D] md:grid">
                <span>Site</span>
                <span>GitHub</span>
                <span>Domain</span>
                <span>Availability</span>
                <span>Deployment</span>
                <span>Branch</span>
              </div>
              {loadingSites && (
                <div className="border-t border-[#2F4156]/5 px-5 py-6 text-sm text-[#567C8D]">
                  Loading your sites...
                </div>
              )}

              {!loadingSites && visibleSites.length === 0 && (
                <div className="border-t border-[#2F4156]/5 px-5 py-6 text-sm text-[#567C8D]">
                  No active sites yet. Create your first site to provision its
                  application workspace.
                </div>
              )}

              {!loadingSites && visibleSites.map((site) => (
                <div
                  key={site.name}
                  className="flex flex-col gap-3 border-t border-[#2F4156]/5 px-5 py-4 text-sm md:grid md:grid-cols-[1.1fr_1.15fr_.9fr_.7fr_.7fr_.55fr] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-10 place-items-center rounded-xl ${site.accent}`}
                    >
                      <Globe2 className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-xs text-[#567C8D]">{site.stack}</p>
                    </div>
                  </div>
                  {site.repositoryUrl ? (
                    <a
                      href={site.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-2 text-[#567C8D] hover:text-[#2F4156]"
                    >
                      <GitFork className="size-4 shrink-0" />
                      <span className="truncate">
                        {site.repositoryUrl.replace("https://github.com/", "")}
                      </span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#567C8D]">No repository</span>
                  )}
                  {site.domainUrl ? (
                    <a
                      href={site.domainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 break-words text-[#567C8D] hover:text-[#2F4156] hover:underline"
                    >
                      {site.domain}
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#567C8D]">{site.domain}</span>
                  )}
                  <AvailabilityPill availability={site.availability} />
                  <div>
                    <StatusPill>{site.status}</StatusPill>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[#567C8D]">
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
                <div className="rounded-2xl bg-[#F1F1F1] p-4 text-sm text-[#567C8D]">
                  Loading deployment activity...
                </div>
              )}

              {!loadingSites && deploymentActivities.length === 0 && (
                <div className="rounded-2xl bg-[#F1F1F1] p-4 text-sm text-[#567C8D]">
                  No deploy activity yet. Create a Laravel site to start the
                  log.
                </div>
              )}

              {!loadingSites && deploymentActivities.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl bg-[#F1F1F1] p-4">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-white">
                    {item.tone === "warning" ? (
                      <Clock3 className="size-4 text-[#2F4156]" />
                    ) : (
                      <CheckCircle2 className="size-4 text-[#467a2d]" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 max-h-10 overflow-hidden break-words text-xs text-[#567C8D] [overflow-wrap:anywhere]">
                      {item.detail}
                    </p>
                    <p className="mt-2 text-xs text-[#567C8D]">
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
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {storageBreakdown.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-[#F1F1F1] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-white">
                      <item.icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-0.5 text-xs text-[#567C8D]">
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
            <div className="mt-6 border-t border-[#2F4156]/5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#2F4156]">
                  Sites using storage
                </h3>
                <span className="text-xs text-[#567C8D]">
                  {formatCount(siteStorage.length, "site")}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {loadingUsage && (
                  <div className="rounded-2xl bg-[#F1F1F1] p-4 text-sm text-[#567C8D]">
                    Checking application storage...
                  </div>
                )}

                {!loadingUsage && siteStorage.length === 0 && (
                  <div className="rounded-2xl bg-[#F1F1F1] p-4 text-sm text-[#567C8D]">
                    No hosted applications found yet.
                  </div>
                )}

                {!loadingUsage && siteStorage.map((site) => (
                  <div
                    key={site.id}
                    className="rounded-2xl bg-[#F1F1F1] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {site.name}
                        </p>
                        <p className="mt-1 text-xs text-[#567C8D]">
                          {formatBreakdownDetail(site)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm">
                        {formatBytes(site.bytes)}
                      </span>
                    </div>
                    {!site.exists && (
                      <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-[#2F4156]">
                        Application files need attention. Contact support if this persists.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


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
              <div className="shrink-0 bg-[#C8D9E6] p-5 sm:p-6">
                <DialogHeader className="pr-10">
                  <span className="w-fit rounded-full bg-white/75 px-4 py-2 text-sm font-medium text-[#2F4156]">
                    Laravel Provisioning
                  </span>
                  <DialogTitle className="mt-5 text-4xl leading-none sm:text-5xl">
                    New Laravel Site
                  </DialogTitle>
                  <DialogDescription className="max-w-md text-[#567C8D]">
                    BerryPanel will prepare your application and connect your public
                    GitHub repository.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
                {creatingSite && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-[#C8D9E6] bg-[#C8D9E6]"
                  >
                    <div className="flex items-start gap-4 p-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#2F4156] shadow-sm">
                        <Loader2 className="size-5 animate-spin" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#2F4156]">
                          Deploying your Laravel site
                        </p>
                        <p className="mt-1 text-sm leading-5 text-[#567C8D]">
                          Keep this window open while BerryPanel talks to GitHub.
                          Public repositories usually finish in under a minute.
                        </p>
                      </div>
                    </div>
                    <div className="h-1 bg-white">
                      <motion.div
                        className="h-full bg-[#C8D9E6]"
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
                                    ? "bg-[#2F4156] text-white"
                                    : "bg-white text-[#567C8D]"
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
                              <p className="text-sm font-medium text-[#2F4156]">
                                {step.label}
                              </p>
                              <p className="text-xs leading-5 text-[#567C8D]">
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
                  <Label htmlFor="site-name" className="text-[#2F4156]">
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
                    className="h-14 rounded-full border-[#C8D9E6] bg-[#F1F1F1] px-5 text-base"
                  />
                  <p className="text-xs leading-5 text-[#567C8D]">
                    Use letters, numbers, spaces, or hyphens. We will convert it
                    into a safe application name.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repository-url" className="text-[#2F4156]">
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
                    className="h-14 rounded-full border-[#C8D9E6] bg-[#F1F1F1] px-5 text-base"
                  />
                  <p className="text-xs leading-5 text-[#567C8D]">
                    For now, only public GitHub repositories are supported.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repository-branch" className="text-[#2F4156]">
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
                    className="h-14 rounded-full border-[#C8D9E6] bg-[#F1F1F1] px-5 text-base"
                  />
                </div>

                <div className="grid gap-3 rounded-2xl bg-[#F1F1F1] p-4 text-sm text-[#567C8D] md:grid-cols-3">
                  <div>
                    <p className="font-medium text-[#2F4156]">Stack</p>
                    <p>Laravel / Inertia</p>
                  </div>
                  <div>
                    <p className="font-medium text-[#2F4156]">PHP</p>
                    <p>8.4</p>
                  </div>
                  <div>
                    <p className="font-medium text-[#2F4156]">Included</p>
                    <p>public, storage, logs</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#2F4156]/5 bg-[#F1F1F1] p-4 text-sm leading-6 text-[#2F4156]">
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
                    className="h-11 rounded-full bg-[#2F4156] px-5 text-white hover:bg-[#2F4156]/85"
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
    </DashboardPageShell>
  );
}
