import type { UsageBreakdownItem } from "@/types/dashboard";

export function siteStatusLabel(status: string): string {
  if (status === "provisioned") {
    return "Provisioned";
  }

  if (status === "needs_configuration") {
    return "Needs configuration";
  }

  return status;
}

export function formatBytes(bytes: number) {
  if (bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  }

  const mb = kb / 1024;

  if (mb < 1024) {
    return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  }

  const gb = mb / 1024;

  return `${gb.toFixed(gb < 10 ? 1 : 0)} GB`;
}

export function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export function formatBreakdownDetail(item?: UsageBreakdownItem) {
  if (!item) {
    return "0 files";
  }

  return `${formatCount(item.files, "file")} / ${formatCount(item.directories, "folder")}`;
}

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return "recently";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "recently";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
