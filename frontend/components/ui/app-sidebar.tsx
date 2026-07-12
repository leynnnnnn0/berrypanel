'use client';

import {
  BookOpen,
  Database,
  Globe2,
  KeyRound,
  LayoutGrid,
  Blocks,
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
];

const footerNavItems: NavItem[] = [
  {
    title: "Hosting Guide",
    href: "/dashboard/hosting-guide",
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
