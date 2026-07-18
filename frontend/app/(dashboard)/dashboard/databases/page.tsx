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
  Check,
  Copy,
  Database,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  MoreVertical,
  Plus,
  ServerCog,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Site = {
  id: number;
  name: string;
  local_url: string | null;
};

type LaravelSite = {
  id: number;
  name: string;
  local_url: string | null;
};

type HostingDatabase = {
  id: number;
  name: string;
  username: string;
  driver: string;
  host: string;
  port: number;
  status: string;
  site: Site | null;
  created_at: string | null;
};

type DatabasesResponse = {
  databases: HostingDatabase[];
};

type SitesResponse = {
  sites: LaravelSite[];
};

type CreateDatabaseResponse = {
  database: HostingDatabase;
};

type UserResponse = {
  linux_username?: string | null;
};

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "provisioned"
      ? "bg-[#dff8c8] text-[#2c4a1f]"
      : "bg-[#F1F1F1] text-[#567C8D]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {status === "provisioned" ? "Provisioned" : status}
    </span>
  );
}

function suffixFrom(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<HostingDatabase[]>([]);
  const [sites, setSites] = useState<LaravelSite[]>([]);
  const [linuxUsername, setLinuxUsername] = useState("user");
  const [databaseSuffix, setDatabaseSuffix] = useState("");
  const [usernameSuffix, setUsernameSuffix] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [databaseToDelete, setDatabaseToDelete] =
    useState<HostingDatabase | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const prefix = `${linuxUsername}_`;
  const fullDatabaseName = `${prefix}${suffixFrom(databaseSuffix)}`;
  const fullUsername = `${prefix}${suffixFrom(usernameSuffix)}`;

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [databaseResponse, siteResponse, userResponse] = await Promise.all([
        api<DatabasesResponse>("/api/databases"),
        api<SitesResponse>("/api/sites"),
        api<UserResponse>("/api/user"),
      ]);

      setDatabases(databaseResponse.databases);
      setSites(siteResponse.sites);
      setLinuxUsername(userResponse.linux_username || "user");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load databases");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Databases", value: loading ? "..." : String(databases.length) },
      {
        label: "Linked Sites",
        value: loading
          ? "..."
          : String(databases.filter((database) => database.site).length),
      },
      { label: "Driver", value: "MySQL" },
    ],
    [databases, loading],
  );

  async function createDatabase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await api<CreateDatabaseResponse>("/api/databases", {
        method: "POST",
        body: JSON.stringify({
          database_suffix: databaseSuffix,
          username_suffix: usernameSuffix,
          password,
          site_id: selectedSiteId ? Number(selectedSiteId) : null,
        }),
      });

      setDatabases((current) => [response.database, ...current]);
      setDatabaseSuffix("");
      setUsernameSuffix("");
      setPassword("");
      setSelectedSiteId("");
      setSuccess("Database and user created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create database");
    } finally {
      setCreating(false);
    }
  }

  async function deleteDatabase() {
    if (!databaseToDelete) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await api(`/api/databases/${databaseToDelete.id}`, {
        method: "DELETE",
      });

      setDatabases((current) =>
        current.filter((database) => database.id !== databaseToDelete.id),
      );
      setDatabaseToDelete(null);
      setSuccess("Database removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete database");
    } finally {
      setDeleting(false);
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <DashboardPage>
        <DashboardHero
          eyebrow="Data services · MySQL management"
          title="Database Management"
          description="Create MySQL databases and users for Laravel applications, then copy credentials into each site's environment configuration."
          icon={Database}
          contextValue="MySQL workspace"
        />

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => {
            const visuals = [
              { icon: Database, tone: "lavender" as const, detail: "managed databases" },
              { icon: Globe2, tone: "sky" as const, detail: "connected applications" },
              { icon: ServerCog, tone: "mist" as const, detail: "database engine" },
            ][index];

            return <MetricCard key={stat.label} {...stat} {...visuals} />;
          })}
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

        <section className="rounded-3xl bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#2F4156]/5 p-6 lg:p-8">
            <span className="grid size-10 place-items-center rounded-full bg-[#F1F1F1]">
              <Plus className="size-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold">
                Create a New MySQL Database And Database User
              </h2>
              <p className="mt-1 text-sm text-[#567C8D]">
                Names are automatically prefixed with your Linux username.
              </p>
            </div>
          </div>

          <form className="grid gap-7 p-6 lg:p-8" onSubmit={createDatabase}>
            <div className="grid gap-3">
              <Label htmlFor="database-name" className="text-base font-semibold">
                MySQL database name
              </Label>
              <div className="grid overflow-hidden rounded-2xl border border-[#2F4156]/10 bg-white md:grid-cols-[300px_1fr]">
                <div className="bg-[#F1F1F1] px-5 py-4 text-[#567C8D]">
                  {prefix}
                </div>
                <Input
                  id="database-name"
                  value={databaseSuffix}
                  placeholder="Database name"
                  required
                  onChange={(event) => setDatabaseSuffix(event.target.value)}
                  className="h-14 rounded-none border-0 px-5 text-base shadow-none"
                />
              </div>
              <p className="font-mono text-xs text-[#567C8D]">
                Full name: {fullDatabaseName}
              </p>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="database-user" className="text-base font-semibold">
                MySQL username
              </Label>
              <div className="grid overflow-hidden rounded-2xl border border-[#2F4156]/10 bg-white md:grid-cols-[300px_1fr]">
                <div className="bg-[#F1F1F1] px-5 py-4 text-[#567C8D]">
                  {prefix}
                </div>
                <Input
                  id="database-user"
                  value={usernameSuffix}
                  placeholder="Username"
                  required
                  onChange={(event) => setUsernameSuffix(event.target.value)}
                  className="h-14 rounded-none border-0 px-5 text-base shadow-none"
                />
              </div>
              <p className="font-mono text-xs text-[#567C8D]">
                Full username: {fullUsername}
              </p>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="database-password" className="text-base font-semibold">
                Password
              </Label>
              <div className="flex overflow-hidden rounded-2xl border border-[#2F4156]/10 bg-white">
                <Input
                  id="database-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Password"
                  required
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-14 rounded-none border-0 px-5 text-base shadow-none"
                />
                <button
                  type="button"
                  className="grid w-14 place-items-center text-[#567C8D]"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="database-site" className="text-base font-semibold">
                Linked website
              </Label>
              <select
                id="database-site"
                value={selectedSiteId}
                onChange={(event) => setSelectedSiteId(event.target.value)}
                className="h-14 rounded-2xl border border-[#2F4156]/10 bg-white px-5 text-base outline-none"
              >
                <option value="">No linked website yet</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="h-12 w-fit rounded-2xl bg-[#567C8D] px-6 text-base text-white hover:bg-[#567C8D]"
              disabled={creating}
            >
              <Check className="size-5" />
              {creating ? "Creating..." : "Create"}
            </Button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
          <div>
            <p className="text-xs font-medium uppercase text-[#567C8D]">
              Inventory
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              List of Current MySQL Databases And Users
            </h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#2F4156]/10">
            <div className="hidden grid-cols-[1fr_1fr_0.8fr_1fr_1fr_0.4fr] bg-[#F1F1F1] px-5 py-4 text-sm font-medium uppercase text-[#567C8D] lg:grid">
              <span>MySQL Database</span>
              <span>MySQL User</span>
              <span>Created at</span>
              <span>Website</span>
              <span>Connection</span>
              <span></span>
            </div>

            {loading && (
              <div className="border-t border-[#2F4156]/5 px-5 py-6 text-sm text-[#567C8D]">
                Loading databases...
              </div>
            )}

            {!loading && databases.length === 0 && (
              <div className="border-t border-[#2F4156]/5 px-5 py-8 text-sm text-[#567C8D]">
                No databases yet. Create your first database for a Laravel site.
              </div>
            )}

            {!loading &&
              databases.map((database) => (
                <div
                  key={database.id}
                  className="flex flex-col gap-4 border-t border-[#2F4156]/5 px-5 py-5 text-sm lg:grid lg:grid-cols-[1fr_1fr_0.8fr_1fr_1fr_0.4fr] lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-[#F1F1F1]">
                      <Database className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{database.name}</p>
                      <StatusPill status={database.status} />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-2 text-left text-[#567C8D]"
                    onClick={() => copyText(database.username)}
                  >
                    <KeyRound className="size-4 shrink-0" />
                    <span className="truncate">{database.username}</span>
                    <Copy className="size-3 shrink-0" />
                  </button>

                  <span className="text-[#567C8D]">
                    {database.created_at ?? "Today"}
                  </span>

                  <span className="flex min-w-0 items-center gap-2 text-[#567C8D]">
                    <Globe2 className="size-4 shrink-0" />
                    <span className="truncate">
                      {database.site?.local_url ?? database.site?.name ?? "Unlinked"}
                    </span>
                  </span>

                  <span className="flex min-w-0 items-center gap-2 text-[#567C8D]">
                    <ServerCog className="size-4 shrink-0" />
                    <span className="truncate">
                      {database.driver}://{database.host}:{database.port}
                    </span>
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-xl"
                        aria-label={`Open actions for ${database.name}`}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-48">
                      <DropdownMenuItem onSelect={() => copyText(database.name)}>
                        <Copy className="size-4" />
                        Copy database name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => copyText(database.username)}
                      >
                        <Copy className="size-4" />
                        Copy username
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDatabaseToDelete(database)}
                      >
                        <Trash2 className="size-4" />
                        Delete database
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
          </div>
        </section>

      <Dialog
        open={!!databaseToDelete}
        onOpenChange={() => setDatabaseToDelete(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Database?</DialogTitle>
            <DialogDescription>
              This will remove{" "}
              <span className="font-medium text-[#2F4156]">
                {databaseToDelete?.name}
              </span>{" "}
              and its database user from BerryPanel. If MariaDB provisioning is
              enabled on the Pi, BerryPanel will also drop them from MariaDB.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-5"
              onClick={() => setDatabaseToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 rounded-full px-5"
              disabled={deleting}
              onClick={deleteDatabase}
            >
              {deleting ? "Deleting..." : "Delete database"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  );
}
