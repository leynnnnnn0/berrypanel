export type SiteAvailability = {
  status: "online" | "redirected" | "offline" | "unknown";
  http_status: number | null;
  response_ms: number | null;
  checked_at: string | null;
  error: string | null;
};

export type Site = {
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
  availability: SiteAvailability;
  deployment_warnings: string[];
  created_at: string | null;
  updated_at: string | null;
};

export type SitesResponse = {
  sites: Site[];
};

export type CreateSiteResponse = {
  site: Site;
};

export type UsageBreakdownItem = {
  bytes: number;
  files: number;
  directories: number;
};

export type SiteUsageItem = UsageBreakdownItem & {
  id: number;
  name: string;
  slug: string;
  exists: boolean;
};

export type UsageResponse = {
  usage: {
    total_bytes: number;
    quota_bytes: number;
    percent: number;
    file_count: number;
    directory_count: number;
    breakdown: {
      application: UsageBreakdownItem;
      uploads: UsageBreakdownItem;
      backups: UsageBreakdownItem;
      logs: UsageBreakdownItem;
    };
    sites: SiteUsageItem[];
  };
};

export type DeployActivity = {
  id: string;
  label: string;
  detail: string;
  tone: "success" | "warning";
  timestamp: string | null;
};
