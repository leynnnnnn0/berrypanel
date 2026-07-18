"use client";

import { Button } from "@/components/ui/button";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AvailabilityPill } from "@/components/dashboard/availability-pill";
import type { HostingAccess, SiteAvailability } from "@/types/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GitFork,
  Globe2,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
};

type SitesResponse = {
  sites: Site[];
  hosting_access: HostingAccess;
};

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "online" || normalized === "provisioned"
      ? "bg-[#dff8c8] text-[#2c4a1f]"
      : normalized === "deploying" || normalized === "needs_configuration"
        ? "bg-[#F1F1F1] text-[#2F4156]"
        : "bg-[#F1F1F1] text-[#567C8D]";
  const label =
    status === "provisioned"
      ? "Provisioned"
      : status === "needs_configuration"
        ? "Needs configuration"
        : status;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

function formatRepo(url: string | null) {
  return url ? url.replace("https://github.com/", "") : "No repository";
}

function siteAddress(url: string) {
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
}

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingSite, setCreatingSite] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositoryBranch, setRepositoryBranch] = useState("main");
  const [hostingAccess, setHostingAccess] = useState<HostingAccess | null>(null);

  useEffect(() => {
    async function loadSites() {
      setLoading(true);
      setError("");

      try {
        const response = await api<SitesResponse>("/api/sites");
        setSites(response.sites);
        setHostingAccess(response.hosting_access);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load sites");
      } finally {
        setLoading(false);
      }
    }

    loadSites();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Sites", value: loading ? "..." : String(sites.length) },
      {
        label: "Connected Repos",
        value: loading
          ? "..."
          : String(sites.filter((site) => site.repository_url).length),
      },
      {
        label: "Online",
        value: loading
          ? "..."
          : String(
              sites.filter((site) => site.availability.status === "online")
                .length,
            ),
      },
    ],
    [loading, sites],
  );

  async function deleteSite() {
    if (!siteToDelete) {
      return;
    }

    setDeletingSite(true);
    setError("");

    try {
      await api(`/api/sites/${siteToDelete.id}`, {
        method: "DELETE",
      });

      setSites((current) =>
        current.filter((site) => site.id !== siteToDelete.id),
      );
      if (siteToDelete.stack === "Laravel / Inertia") {
        setHostingAccess((current) => current ? {
          ...current,
          laravel_sites: {
            ...current.laravel_sites,
            used: Math.max(0, current.laravel_sites.used - 1),
            can_create: true,
          },
        } : current);
      }
      setSiteToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete site");
    } finally {
      setDeletingSite(false);
    }
  }

  async function createSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingSite(true);
    setError("");

    try {
      const response = await api<{ site: Site }>("/api/sites", {
        method: "POST",
        body: JSON.stringify({
          name: siteName,
          repository_url: repositoryUrl,
          repository_branch: repositoryBranch,
          php_version: "8.4",
        }),
      });

      setSites((current) => [response.site, ...current]);
      setHostingAccess((current) => current ? {
        ...current,
        laravel_sites: {
          ...current.laravel_sites,
          used: current.laravel_sites.used + 1,
          can_create: current.laravel_sites.used + 1 < current.laravel_sites.limit,
        },
      } : current);
      setSiteName("");
      setRepositoryUrl("");
      setRepositoryBranch("main");
      setCreateOpen(false);
      toast.success("Your Laravel deployment was added to the queue.");
      router.push(`/dashboard/sites/${response.site.id}/hosting`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create site");
    } finally {
      setCreatingSite(false);
    }
  }

  return (
    <DashboardPage>
        <DashboardHero
          eyebrow="Application inventory · All hosting"
          title="Sites"
          description="Manage Laravel and Node.js applications, repositories, branches, domains, and deployment status from one inventory."
          icon={Globe2}
          contextValue="Application inventory"
          action={
            hostingAccess?.laravel_sites.can_create ? (
              <Button
                className="h-12 rounded-full bg-white px-5 text-sm font-semibold text-[#2F4156] hover:bg-white/90"
                onClick={() => {
                  setError("");
                  setCreateOpen(true);
                }}
              >
                <Plus className="size-4" />
                New Laravel Site
              </Button>
            ) : (
              <Button asChild className="h-12 rounded-full bg-white px-5 text-sm font-semibold text-[#2F4156] hover:bg-white/90">
                <Link href="/dashboard/billing">View hosting plans</Link>
              </Button>
            )
          }
        />

        {hostingAccess && (
          <p className="rounded-2xl bg-[#F1F1F1] px-4 py-3 text-sm text-[#2F4156]">
            Laravel sites: {hostingAccess.laravel_sites.used} of {hostingAccess.laravel_sites.limit} used
            {!hostingAccess.laravel_sites.can_create && <> · <Link className="font-semibold underline" href="/dashboard/billing">Manage plan</Link></>}
          </p>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => {
            const visuals = [
              { icon: Globe2, tone: "lavender" as const, detail: "hosted applications" },
              { icon: GitFork, tone: "sky" as const, detail: "connected repositories" },
              { icon: CheckCircle2, tone: "mist" as const, detail: "responding successfully" },
            ][index];

            return <MetricCard key={stat.label} {...stat} {...visuals} />;
          })}
        </section>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-[#567C8D]">
                Inventory
              </p>
              <h2 className="mt-1 text-xl font-semibold">All Sites</h2>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#2F4156]/5">
            <div className="hidden grid-cols-[1.05fr_1.15fr_.9fr_.7fr_.75fr_.35fr] bg-[#F1F1F1] px-5 py-3 text-xs font-medium uppercase text-[#567C8D] lg:grid">
              <span>Site</span>
              <span>GitHub</span>
              <span>Domain</span>
              <span>Availability</span>
              <span>Deployment</span>
              <span>Actions</span>
            </div>

            {loading && (
              <div className="border-t border-[#2F4156]/5 px-5 py-6 text-sm text-[#567C8D]">
                Loading sites...
              </div>
            )}

            {!loading && sites.length === 0 && (
              <div className="border-t border-[#2F4156]/5 px-5 py-8 text-sm text-[#567C8D]">
                No sites yet. Create your first Laravel site from the overview.
              </div>
            )}

            {!loading &&
              sites.map((site, index) => (
                <div
                  key={site.id}
                  className="flex flex-col gap-4 border-t border-[#2F4156]/5 px-5 py-5 text-sm lg:grid lg:grid-cols-[1.05fr_1.15fr_.9fr_.7fr_.75fr_.35fr] lg:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-11 place-items-center rounded-xl ${
                        index % 2 === 0 ? "bg-[#C8D9E6]" : "bg-[#F1F1F1]"
                      }`}
                    >
                      <Globe2 className="size-5" />
                    </span>
                    <div>
                      <Link
                        href={`/dashboard/sites/${site.id}`}
                        className="font-medium hover:underline"
                      >
                        {site.name}
                      </Link>
                      <p className="text-xs text-[#567C8D]">
                        {site.stack} / PHP {site.php_version}
                      </p>
                    </div>
                  </div>

                  {site.repository_url ? (
                    <a
                      href={site.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-2 text-[#567C8D] hover:text-[#2F4156]"
                    >
                      <GitFork className="size-4 shrink-0" />
                      <span className="truncate">
                        {formatRepo(site.repository_url)}
                      </span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#567C8D]">{formatRepo(null)}</span>
                  )}

                  {site.local_url ? (
                    <a
                      href={siteAddress(site.local_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 break-words text-[#567C8D] hover:text-[#2F4156] hover:underline"
                    >
                      {site.local_url}
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#567C8D]">Pending local domain</span>
                  )}

                  <AvailabilityPill availability={site.availability} />

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={site.status} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F1F1] px-3 py-1 text-xs text-[#567C8D]">
                      <GitBranch className="size-3" />
                      {site.repository_branch || "main"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          aria-label={`Open actions for ${site.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/sites/${site.id}`}>
                            <ArrowUpRight className="size-4" />
                            Open details
                          </Link>
                        </DropdownMenuItem>
                        {site.repository_url && (
                          <DropdownMenuItem asChild>
                            <a
                              href={site.repository_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ArrowUpRight className="size-4" />
                              Open repository
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setSiteToDelete(site)}
                        >
                          <Trash2 className="size-4" />
                          Delete site
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
          </div>
        </section>

      <Dialog open={createOpen} onOpenChange={(open) => !creatingSite && setCreateOpen(open)}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="bg-[#C8D9E6] p-7 pr-14">
            <DialogTitle className="text-3xl">New Laravel Site</DialogTitle>
            <DialogDescription>
              Connect a public GitHub repository and BerryPanel will prepare the site.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createSite}>
            <div className="grid gap-5 p-7">
              {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="new-site-name">Site name</Label>
                <Input id="new-site-name" value={siteName} onChange={(event) => setSiteName(event.target.value)} placeholder="my-laravel-site" pattern="[A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9]" required disabled={creatingSite} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-site-repository">Public GitHub URL</Label>
                <Input id="new-site-repository" type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/user/laravel-app" pattern="https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(\.git)?" required disabled={creatingSite} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-site-branch">Branch</Label>
                <Input id="new-site-branch" value={repositoryBranch} onChange={(event) => setRepositoryBranch(event.target.value)} placeholder="main" pattern="[A-Za-z0-9._/-]+" required disabled={creatingSite} className="h-12 rounded-xl" />
              </div>
            </div>
            <DialogFooter className="border-t border-[#2F4156]/10 p-6">
              <Button type="button" variant="outline" className="rounded-full" disabled={creatingSite} onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-full bg-[#2F4156] text-white" disabled={creatingSite}>
                {creatingSite ? <><Loader2 className="animate-spin" />Creating site...</> : <><Plus />Create site</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!siteToDelete} onOpenChange={() => setSiteToDelete(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Laravel Site?</DialogTitle>
            <DialogDescription>
              This will remove{" "}
              <span className="font-medium text-[#2F4156]">
                {siteToDelete?.name}
              </span>{" "}
              from BerryPanel. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-5"
              onClick={() => setSiteToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 rounded-full px-5"
              disabled={deletingSite}
              onClick={deleteSite}
            >
              {deletingSite ? "Deleting..." : "Delete site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  );
}
