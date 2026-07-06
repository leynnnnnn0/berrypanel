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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  GitBranch,
  GitFork,
  Globe2,
  MoreHorizontal,
  Plus,
  ServerCog,
  Terminal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function formatRepo(url: string | null) {
  return url ? url.replace("https://github.com/", "") : "No repository";
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState(false);

  useEffect(() => {
    async function loadSites() {
      setLoading(true);
      setError("");

      try {
        const response = await api<SitesResponse>("/api/sites");
        setSites(response.sites);
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
        label: "Provisioned",
        value: loading
          ? "..."
          : String(
              sites.filter((site) => site.status.toLowerCase() === "provisioned")
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
      setSiteToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete site");
    } finally {
      setDeletingSite(false);
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#121212]">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-[#d8cef2] px-4 py-2 text-sm font-medium">
                Sites Module
              </span>
              <h1 className="mt-5 text-5xl font-semibold leading-none md:text-7xl">
                Laravel Sites
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-6 text-[#666]">
                Manage every hosted Laravel/Inertia app, its public GitHub
                repository, branch, local domain, and provisioned folder paths.
              </p>
            </div>

            <Button
              asChild
              className="h-12 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/85"
            >
              <Link href="/dashboard">
                <Plus className="size-4" />
                New Laravel Site
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-black/5 bg-[#f7f7f7] p-5"
              >
                <p className="text-sm text-[#777]">{stat.label}</p>
                <p className="mt-4 text-4xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-[#8a8a8a]">
                Inventory
              </p>
              <h2 className="mt-1 text-xl font-semibold">All Sites</h2>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
            <div className="hidden grid-cols-[1.1fr_1.25fr_1fr_0.7fr_0.85fr_0.45fr] bg-[#f7f7f7] px-5 py-3 text-xs font-medium uppercase text-[#777] lg:grid">
              <span>Site</span>
              <span>GitHub</span>
              <span>Domain</span>
              <span>Status</span>
              <span>Server Path</span>
              <span>Actions</span>
            </div>

            {loading && (
              <div className="border-t border-black/5 px-5 py-6 text-sm text-[#777]">
                Loading sites...
              </div>
            )}

            {!loading && sites.length === 0 && (
              <div className="border-t border-black/5 px-5 py-8 text-sm text-[#777]">
                No sites yet. Create your first Laravel site from the overview.
              </div>
            )}

            {!loading &&
              sites.map((site, index) => (
                <div
                  key={site.id}
                  className="flex flex-col gap-4 border-t border-black/5 px-5 py-5 text-sm lg:grid lg:grid-cols-[1.1fr_1.25fr_1fr_0.7fr_0.85fr_0.45fr] lg:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-11 place-items-center rounded-xl ${
                        index % 2 === 0 ? "bg-[#d8cef2]" : "bg-[#fff0b8]"
                      }`}
                    >
                      <Globe2 className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-xs text-[#777]">
                        {site.stack} / PHP {site.php_version}
                      </p>
                    </div>
                  </div>

                  {site.repository_url ? (
                    <a
                      href={site.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-2 text-[#555] hover:text-black"
                    >
                      <GitFork className="size-4 shrink-0" />
                      <span className="truncate">
                        {formatRepo(site.repository_url)}
                      </span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#777]">{formatRepo(null)}</span>
                  )}

                  <span className="break-words text-[#555]">
                    {site.local_url ?? "Pending local domain"}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={site.status} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f4] px-3 py-1 text-xs text-[#555]">
                      <GitBranch className="size-3" />
                      {site.repository_branch || "main"}
                    </span>
                  </div>

                  <span className="flex min-w-0 items-center gap-2 text-[#555]">
                    <ServerCog className="size-4 shrink-0" />
                    <span className="truncate">{site.root_path}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full px-3"
                    >
                      <Terminal className="size-4" />
                      Deploy
                    </Button>
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
                        <DropdownMenuItem
                          onSelect={() => copyText(site.root_path)}
                        >
                          <Copy className="size-4" />
                          Copy root path
                        </DropdownMenuItem>
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
      </div>

      <Dialog open={!!siteToDelete} onOpenChange={() => setSiteToDelete(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Laravel Site?</DialogTitle>
            <DialogDescription>
              This will remove{" "}
              <span className="font-medium text-[#151515]">
                {siteToDelete?.name}
              </span>{" "}
              from BerryPanel and delete its provisioned site folder. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl bg-[#f7f7f7] p-4 text-sm text-[#555]">
            <p className="font-medium text-[#151515]">Folder to delete</p>
            <p className="mt-2 break-words">{siteToDelete?.root_path}</p>
          </div>

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
    </div>
  );
}
