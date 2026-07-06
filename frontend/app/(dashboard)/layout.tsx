import AppSidebarLayout from "@/app/layouts/app/app-sidebar-layout";
import type { AppLayoutProps } from "@/types/ui";

export default function DashboardLayout({
  children,
  breadcrumbs,
  ...props
}: AppLayoutProps) {
  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} {...props}>
      <div className="p-4 md:p-6">{children}</div>
    </AppSidebarLayout>
  );
}
