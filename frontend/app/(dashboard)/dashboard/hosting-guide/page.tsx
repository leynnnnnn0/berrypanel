import { BookOpen, LifeBuoy, ServerCog } from "lucide-react";
import { HostingGuideTabs } from "@/components/hosting-guide/guide-tabs";

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
      "Understand domains, Cloudflare, storage limits, safe commands, and what still needs server action.",
    icon: BookOpen,
  },
];

export default function HostingGuidePage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.5fr)] lg:p-12">
            <div className="max-w-4xl space-y-6">
              <span className="inline-flex w-fit rounded-full bg-[#d8ccf4] px-5 py-2 text-sm font-semibold text-neutral-950">
                BerryPanel Documentation
              </span>
              <div className="space-y-4">
                <h1 className="text-5xl font-semibold tracking-normal text-neutral-950 sm:text-6xl lg:text-7xl">
                  Hosting Guide
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-neutral-600">
                  Everything customers need to launch and maintain Laravel sites
                  on BerryPanel: repository requirements, deployment steps,
                  accepted terminal commands, domain routing, and fixes for the
                  errors they are most likely to hit.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white">
                      <item.icon className="h-6 w-6 text-neutral-950" />
                    </span>
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-neutral-950">
                        {item.title}
                      </h2>
                      <p className="text-sm leading-6 text-neutral-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HostingGuideTabs />
      </div>
    </main>
  );
}
