"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  FileCode2,
  Globe2,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { ErrorHelper } from "@/components/hosting-guide/error-helper";
import {
  acceptedCommands,
  domainGuides,
  guideTabs,
  hostingSteps,
  repositoryRequirements,
  safetyNotes,
  type GuideTabId,
} from "@/components/hosting-guide/guide-data";
import {
  CommandBlock,
  DotList,
  GuideSection,
  InfoCard,
} from "@/components/hosting-guide/guide-section";
import { cn } from "@/lib/utils";

const stackCards = [
  {
    title: "Laravel + Inertia",
    icon: FileCode2,
    description:
      "Best fit for the current shared-hosting flow. BerryPanel installs PHP dependencies and builds frontend assets.",
  },
  {
    title: "Laravel API only",
    icon: Code2,
    description:
      "Supported. The app may not need npm build as long as it has valid routes, .env, database, and APP_KEY.",
  },
  {
    title: "Databases",
    icon: Database,
    description:
      "Create MySQL databases from BerryPanel, then paste credentials into the site environment form.",
  },
  {
    title: "Public domains",
    icon: Globe2,
    description:
      "Every site gets a public HTTPS subdomain under the configured wildcard domain.",
  },
];

const runtimeChecklist = [
  {
    title: "Repository cloned",
    description: "Your repository is connected and ready to deploy.",
  },
  {
    title: "Dependencies installed",
    description: "vendor exists, and public/build exists when the app uses Vite.",
  },
  {
    title: ".env configured",
    description: "APP_URL, APP_KEY, DB credentials, cache, queue, and session settings are saved.",
  },
  {
    title: "Database migrated",
    description: "php artisan migrate --force has created the app tables.",
  },
  {
    title: "Public URL verified",
    description: "The generated HTTPS subdomain loads the expected Laravel app.",
  },
];

function TabButton({
  tab,
  active,
  onSelect,
}: {
  tab: (typeof guideTabs)[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "min-w-[180px] rounded-2xl border px-4 py-3 text-left transition sm:min-w-0",
        active
          ? "border-[#2F4156] bg-[#2F4156] text-white"
          : "border-[#C8D9E6] bg-white text-[#567C8D] hover:border-[#567C8D]"
      )}
    >
      <span className="block text-sm font-semibold">{tab.label}</span>
      <span
        className={cn(
          "mt-1 block text-xs leading-5",
          active ? "text-[#C8D9E6]" : "text-[#567C8D]"
        )}
      >
        {tab.summary}
      </span>
    </button>
  );
}

function StartHereTab() {
  return (
    <div className="space-y-10">
      <GuideSection
        eyebrow="Overview"
        title="What BerryPanel does for a Laravel site"
        description="BerryPanel helps you publish and manage your Laravel applications from one secure workspace."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stackCards.map((card) => (
            <InfoCard key={card.title} className="space-y-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8D9E6]">
                <card.icon className="h-6 w-6 text-[#2F4156]" />
              </span>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#2F4156]">
                  {card.title}
                </h3>
                <p className="text-sm leading-6 text-[#567C8D]">
                  {card.description}
                </p>
              </div>
            </InfoCard>
          ))}
        </div>
      </GuideSection>

      <GuideSection
        eyebrow="Repository"
        title="Before creating a site"
        description="A clean repository avoids most deployment problems. Check these items before pasting a GitHub URL."
      >
        <InfoCard>
          <DotList items={repositoryRequirements} />
        </InfoCard>
      </GuideSection>
    </div>
  );
}

function DeployTab() {
  return (
    <GuideSection
      eyebrow="Hosting flow"
      title="From GitHub URL to a live Laravel app"
      description="This is the standard path every customer should follow when launching a site."
    >
      <div className="grid gap-4">
        {hostingSteps.map((step, index) => (
          <InfoCard key={step.title} className="grid gap-5 md:grid-cols-[auto_1fr]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2F4156] text-lg font-semibold text-white">
              {index + 1}
            </span>
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-[#2F4156]">
                  {step.title}
                </h3>
                <p className="text-sm leading-6 text-[#567C8D]">
                  {step.description}
                </p>
              </div>
              <DotList items={step.details} />
            </div>
          </InfoCard>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {runtimeChecklist.map((item) => (
          <InfoCard key={item.title} className="space-y-3 bg-[#F1F1F1]">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <h3 className="text-base font-semibold text-[#2F4156]">
              {item.title}
            </h3>
            <p className="text-sm leading-6 text-[#567C8D]">
              {item.description}
            </p>
          </InfoCard>
        ))}
      </div>
    </GuideSection>
  );
}

function CommandsTab() {
  const groups = useMemo(
    () => [
      {
        label: "Dependencies",
        commands: acceptedCommands.filter(
          (item) =>
            item.command.startsWith("composer") ||
            item.command.startsWith("npm")
        ),
      },
      {
        label: "Laravel runtime",
        commands: acceptedCommands.filter((item) =>
          item.command.startsWith("php artisan")
        ),
      },
      {
        label: "Git and logs",
        commands: acceptedCommands.filter(
          (item) => item.command.startsWith("git") || item.command.startsWith("tail")
        ),
      },
    ],
    []
  );

  return (
    <GuideSection
      eyebrow="Safe terminal"
      title="Commands accepted by BerryPanel"
      description="The site terminal is intentionally limited. It is designed for Laravel deployment tasks, not full Linux administration."
    >
      <div className="grid gap-6">
        {groups.map((group) => (
          <InfoCard key={group.label} className="space-y-5">
            <div className="flex items-center gap-3">
              <TerminalSquare className="h-6 w-6 text-[#2F4156]" />
              <h3 className="text-2xl font-semibold text-[#2F4156]">
                {group.label}
              </h3>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {group.commands.map((item) => (
                <div
                  key={item.command}
                  className="space-y-3 rounded-2xl border border-[#C8D9E6] bg-[#F1F1F1] p-4"
                >
                  <CommandBlock command={item.command} />
                  <p className="text-sm leading-6 text-[#567C8D]">
                    {item.purpose}
                  </p>
                  <p className="text-xs leading-5 text-[#567C8D]">
                    {item.whenToUse}
                  </p>
                </div>
              ))}
            </div>
          </InfoCard>
        ))}
      </div>
    </GuideSection>
  );
}

function DomainsTab() {
  return (
    <div className="space-y-10">
      <GuideSection
        eyebrow="Public routing"
        title="How HTTPS and wildcard domains reach the Pi"
        description="BerryPanel automatically prepares a secure public address for each hosted application."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {domainGuides.map((item) => (
            <InfoCard key={item.title} className="space-y-4">
              <Cloud className="h-7 w-7 text-[#2F4156]" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#2F4156]">
                  {item.title}
                </h3>
                <p className="break-all rounded-2xl bg-[#C8D9E6] px-4 py-3 font-mono text-sm text-[#2F4156]">
                  {item.value}
                </p>
                <p className="text-sm leading-6 text-[#567C8D]">
                  {item.description}
                </p>
              </div>
            </InfoCard>
          ))}
        </div>
      </GuideSection>

      <GuideSection
        eyebrow="Domains"
        title="Your application address"
        description="Your generated address is ready after deployment. Connect a custom domain from domain settings when available."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <InfoCard className="space-y-4 border-[#C8D9E6] bg-[#C8D9E6]">
            <h3 className="text-xl font-semibold text-[#2F4156]">
              Automatic address
            </h3>
            <p className="text-sm leading-6 text-[#567C8D]">
              BerryPanel assigns an address for your application automatically.
            </p>
          </InfoCard>
          <InfoCard className="space-y-4">
            <h3 className="text-xl font-semibold text-[#2F4156]">
              Custom domains
            </h3>
            <p className="text-sm leading-6 text-[#567C8D]">
              Contact support if you need help connecting or verifying a custom domain.
            </p>
          </InfoCard>
        </div>
      </GuideSection>
    </div>
  );
}

function LimitsTab() {
  return (
    <GuideSection
      eyebrow="Operations"
      title="Limits, safety, and what is not automated yet"
      description="BerryPanel is shared hosting first. Keep each customer isolated, keep dangerous commands out, and make resource limits visible."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard className="space-y-4">
          <HardDrive className="h-7 w-7 text-[#2F4156]" />
          <h3 className="text-xl font-semibold text-[#2F4156]">
            1.2 GB workspace limit per user
          </h3>
          <p className="text-sm leading-6 text-[#567C8D]">
            Storage usage includes site files, vendor, node_modules, public
            assets, uploads, logs, and backups.
          </p>
        </InfoCard>
        <InfoCard className="space-y-4">
          <ShieldCheck className="h-7 w-7 text-[#2F4156]" />
          <h3 className="text-xl font-semibold text-[#2F4156]">
            Command allowlist
          </h3>
          <p className="text-sm leading-6 text-[#567C8D]">
            Customers can run common Laravel deploy commands without full shell
            access to the server.
          </p>
        </InfoCard>
        <InfoCard className="space-y-4">
          <LockKeyhole className="h-7 w-7 text-[#2F4156]" />
          <h3 className="text-xl font-semibold text-[#2F4156]">
            SSH is optional
          </h3>
          <p className="text-sm leading-6 text-[#567C8D]">
            Public SSH is not required for normal hosting. The site terminal is
            the preferred customer experience for now.
          </p>
        </InfoCard>
      </div>

      <InfoCard className="mt-6">
        <DotList items={safetyNotes} />
      </InfoCard>
    </GuideSection>
  );
}

function ErrorTab() {
  return (
    <GuideSection
      eyebrow="Troubleshooting"
      title="Paste an error and get the next step"
      description="Paste an application error to see practical next steps for resolving it."
    >
      <ErrorHelper />
    </GuideSection>
  );
}

function ActiveTabContent({ activeTab }: { activeTab: GuideTabId }) {
  switch (activeTab) {
    case "start":
      return <StartHereTab />;
    case "deploy":
      return <DeployTab />;
    case "commands":
      return <CommandsTab />;
    case "errors":
      return <ErrorTab />;
    case "domains":
      return <DomainsTab />;
    case "limits":
      return <LimitsTab />;
  }
}

export function HostingGuideTabs() {
  const [activeTab, setActiveTab] = useState<GuideTabId>("start");

  return (
    <div className="space-y-8">
      <div className="grid gap-3 overflow-x-auto pb-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {guideTabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            active={activeTab === tab.id}
            onSelect={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      <div className="rounded-[28px] border border-[#C8D9E6] bg-white p-5 shadow-sm sm:p-8">
        <ActiveTabContent activeTab={activeTab} />
      </div>

      <div className="grid gap-4 rounded-[28px] bg-[#2F4156] p-6 text-white lg:grid-cols-[auto_1fr]">
        <AlertCircle className="h-8 w-8 text-[#F1F1F1]" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">When in doubt, read the log first</h2>
          <p className="max-w-4xl text-sm leading-6 text-[#C8D9E6]">
            Deployment and application logs usually explain what needs attention.
            Review the message, then follow the suggested next step.
          </p>
          <CommandBlock command="tail -n 80 storage/logs/laravel.log" />
        </div>
      </div>
    </div>
  );
}
