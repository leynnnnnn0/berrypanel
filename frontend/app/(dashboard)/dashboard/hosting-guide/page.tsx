import { BookOpen, LifeBuoy, ServerCog } from "lucide-react";
import { HostingGuideTabs } from "@/components/hosting-guide/guide-tabs";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { MetricCard } from "@/components/dashboard/metric-card";

const highlights = [
  {
    title: "Full hosting flow",
    description:
      "Create a site, pull GitHub, configure .env, run Laravel commands, and verify the public URL.",
    icon: ServerCog,
  },
  {
    title: "Error playbooks",
    description:
      "Paste real deployment errors and get the likely cause, owner, and next commands.",
    icon: LifeBuoy,
  },
  {
    title: "Production boundaries",
    description:
      "Understand domains, storage limits, safe commands, and application support.",
    icon: BookOpen,
  },
];

export default function HostingGuidePage() {
  return (
    <DashboardPage>
        <DashboardHero
          eyebrow="Documentation · Hosting playbooks"
          title="Hosting Guide"
          description="Launch and maintain Laravel sites with repository requirements, deployment steps, safe commands, domain guidance, and practical error fixes."
          icon={BookOpen}
          contextValue="Guides and troubleshooting"
        />

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item, index) => (
            <MetricCard
              key={item.title}
              label={item.title}
              value={`0${index + 1}`}
              detail={item.description}
              icon={item.icon}
              tone={(["lavender", "sky", "mist"] as const)[index]}
              eyebrow="Guide section"
            />
          ))}
        </section>

        <HostingGuideTabs />
    </DashboardPage>
  );
}
