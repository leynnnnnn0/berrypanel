import {
  Blocks,
  BookOpen,
  CreditCard,
  Database,
  Globe2,
  KeyRound,
  LayoutDashboard,
  PanelsTopLeft,
} from "lucide-react";

import type { BreadcrumbItem, NavItem } from "@/types/navigation";

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sites",
    href: "/dashboard/sites",
    icon: PanelsTopLeft,
  },
  {
    title: "Node + Laravel Hosting",
    href: "/dashboard/node-laravel-hosting",
    icon: Blocks,
  },
  {
    title: "Domains",
    href: "/dashboard/domains",
    icon: Globe2,
  },
  {
    title: "Databases",
    href: "/dashboard/databases",
    icon: Database,
  },
  {
    title: "SSH Access",
    href: "/dashboard/ssh-access",
    icon: KeyRound,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Hosting Guide",
    href: "/dashboard/hosting-guide",
    icon: BookOpen,
  },
];

const segmentTitles: Record<string, string> = {
  sites: "Sites",
  "node-laravel-hosting": "Node + Laravel Hosting",
  domains: "Domains",
  databases: "Databases",
  "ssh-access": "SSH Access",
  "hosting-guide": "Hosting Guide",
  billing: "Billing",
  hosting: "Hosting",
};

function formatSegment(segment: string, previousSegment?: string) {
  if (previousSegment === "sites" && !segmentTitles[segment]) {
    return "Site details";
  }

  if (previousSegment === "node-laravel-hosting" && !segmentTitles[segment]) {
    return "Project details";
  }

  return (
    segmentTitles[segment] ??
    decodeURIComponent(segment)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function getDashboardBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "dashboard") {
    return [];
  }

  if (segments.length === 1) {
    return [{ title: "Dashboard", href: "/dashboard" }];
  }

  const breadcrumbs: BreadcrumbItem[] = [];

  segments.slice(1).forEach((segment, index) => {
    const routeSegments = segments.slice(0, index + 2);
    breadcrumbs.push({
      title: formatSegment(segment, segments[index]),
      href: `/${routeSegments.join("/")}`,
    });
  });

  return breadcrumbs;
}
