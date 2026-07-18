"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentUrl } from "@/hooks/use-current-url";
import type { NavItem } from "@/types/navigation";
import Link from "next/link";

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const { currentUrl, isCurrentOrParentUrl } = useCurrentUrl();

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
        Workspace
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const href =
            typeof item.href === "string"
              ? item.href
              : item.href.pathname ?? "/";
          const isActive =
            href === "/dashboard"
              ? currentUrl === href
              : isCurrentOrParentUrl(item.href);

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={{ children: item.title }}
                className="h-11 gap-3 rounded-xl px-3 text-white/75 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#C8D9E6] data-[active=true]:font-semibold data-[active=true]:text-[#2F4156] [&_svg]:size-[18px]"
              >
                <Link href={item.href} prefetch>
                  {item.icon && <item.icon strokeWidth={1.8} />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
