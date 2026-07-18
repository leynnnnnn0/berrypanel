'use client';

import type { CSSProperties } from "react";

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
import { mainNavItems } from "@/lib/dashboard-navigation";
import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="berrypanel-sidebar"
      style={
        {
          "--sidebar": "#2F4156",
          "--sidebar-foreground": "#ffffff",
          "--sidebar-primary": "#C8D9E6",
          "--sidebar-primary-foreground": "#2F4156",
          "--sidebar-accent": "rgba(200, 217, 230, 0.16)",
          "--sidebar-accent-foreground": "#ffffff",
          "--sidebar-border": "rgba(200, 217, 230, 0.2)",
          "--sidebar-ring": "#C8D9E6",
        } as CSSProperties
      }
    >
      <SidebarHeader className="bg-sidebar px-3 pb-4 pt-3 text-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-14 px-2 hover:bg-white/10 data-[state=open]:bg-white/10"
            >
              <Link href="/dashboard" prefetch aria-label="BerryPanel dashboard">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#C8D9E6] text-xs font-bold tracking-tight text-[#2F4156] shadow-sm">
                  BP
                </span>
                <span className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    BerryPanel
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] font-medium text-white/45">
                    Laravel hosting panel
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar text-white">
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter className="bg-sidebar text-white">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
