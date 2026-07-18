import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { toUrl } from "@/lib/utils";
import { NavItem } from "@/types/navigation";

function isExternalUrl(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function NavFooter({
  items,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
  items: NavItem[];
}) {
  return (
    <SidebarGroup
      {...props}
      className={`group-data-[collapsible=icon]:p-0 ${className || ""}`}
    >
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const href = toUrl(item.href);
            const content = (
              <>
                {item.icon && <item.icon className="h-5 w-5" />}
                <span>{item.title}</span>
              </>
            );

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className="text-[#567C8D] hover:text-[#2F4156] dark:text-[#C8D9E6] dark:hover:text-white"
                >
                  {isExternalUrl(href) ? (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {content}
                    </a>
                  ) : (
                    <Link href={href}>{content}</Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
