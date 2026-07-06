'use client';

import {
  BookOpen,
  Database,
  Folder,
  Globe2,
  KeyRound,
  LayoutGrid,
  LifeBuoy,
  Rocket,
} from "lucide-react";
import { NavFooter } from "@/components/ui/nav-footer";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavItem } from "@/types/navigation";
import Link from "next/link";

const mainNavItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Sites",
    href: "/dashboard/sites",
    icon: Globe2,
  },
  {
    title: "Deployments",
    href: "/dashboard/deployments",
    icon: Rocket,
  },
  {
    title: "Databases",
    href: "/dashboard/databases",
    icon: Database,
  },
  {
    title: "Files",
    href: "/dashboard/files",
    icon: Folder,
  },
  {
    title: "SSH Access",
    href: "/dashboard/ssh-access",
    icon: KeyRound,
  },
  {
    title: "Support",
    href: "/dashboard/support",
    icon: LifeBuoy,
  },
];

const footerNavItems: NavItem[] = [
  {
    title: "Hosting Guide",
    href: "https://laravel.com/docs/deployment",
    icon: BookOpen,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <span className="text-center text-sm font-bold">
                  BerryPanel
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
