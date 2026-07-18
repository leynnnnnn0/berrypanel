import { SidebarTrigger } from "@/components/ui/sidebar";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";

export function AppSidebarHeader({
  breadcrumbs = [],
}: {
  breadcrumbs?: BreadcrumbItemType[];
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[76px] shrink-0 items-center gap-2 border-b border-[#C8D9E6] bg-white/92 px-4 backdrop-blur-xl transition-[width,height] ease-linear md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="size-10 shrink-0 rounded-xl border border-[#C8D9E6] bg-white text-[#2F4156] shadow-sm hover:bg-[#C8D9E6]" />
        <div className="h-5 w-px bg-[#C8D9E6]" />
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>
    </header>
  );
}
