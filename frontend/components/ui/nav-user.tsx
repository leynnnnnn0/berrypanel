"use client";

import { ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { UserInfo } from "./user-info";
import { UserMenuContent } from "./user-menu-content";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/lib/api";

type AuthenticatedUser = {
  name: string;
  email: string;
  avatar?: string;
};

export function NavUser() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<AuthenticatedUser>({
    name: "Your account",
    email: "Authenticated user",
    avatar: "",
  });

  useEffect(() => {
    api<AuthenticatedUser>("/api/user")
      .then((response) => setUser(response))
      .catch(() => undefined);
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group h-14 rounded-xl border border-white/12 bg-white/5 px-2.5 text-white hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white"
            >
              <UserInfo user={user} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="end"
            side={
              isMobile ? "bottom" : state === "collapsed" ? "left" : "bottom"
            }
          >
            <UserMenuContent user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
