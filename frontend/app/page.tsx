"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  CircleHelp,
  Clock3,
  CloudUpload,
  Code2,
  Database,
  Globe2,
  Menu,
  Rocket,
  ServerCog,
  Share2,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Feature = {
  title: string;
  body: string;
  visual: "deploy" | "workspace" | "services";
};

type ProcessStep = {
  icon: LucideIcon;
  title: string;
  body: string;
  step: string;
};

type Plan = {
  name: string;
  body: string;
  price: string;
  features: string[];
  tone: "lavender" | "white" | "cream" | "dark";
};

const navItems = [
  "Home",
  "Hosting",
  "Features",
  "Students",
  "Process",
  "Plans",
];

const features: Feature[] = [
  {
    title: "Deploy From GitHub",
    body: "Connect your repository and follow a clear path from source code to a live website.",
    visual: "deploy",
  },
  {
    title: "Manage It In One Place",
    body: "Keep your sites, domains, databases, environments, and deployments together.",
    visual: "workspace",
  },
  {
    title: "Add Power As You Grow",
    body: "Turn on queues, schedules, Reverb, and Node.js when your application needs more.",
    visual: "services",
  },
];

const processSteps: ProcessStep[] = [
  {
    icon: CloudUpload,
    title: "Tell us about your site",
    body: "Add your project, choose its name, and select the web address your customers will visit.",
    step: "Step 1",
  },
  {
    icon: Code2,
    title: "Review your setup",
    body: "Confirm the website details and the features your Laravel application needs to run smoothly.",
    step: "Step 2",
  },
  {
    icon: Database,
    title: "Publish your website",
    body: "BerryPanel prepares your application and guides it through one consistent publishing flow.",
    step: "Step 3",
  },
  {
    icon: Rocket,
    title: "Manage with confidence",
    body: "Track its status, review recent activity, and quickly see when something needs your attention.",
    step: "Step 4",
  },
];

const plans: Plan[] = [
  {
    name: "Free",
    body: "A practical starting point for coursework, portfolios, and early capstone demos.",
    price: "₱0",
    features: ["2 Laravel sites", "Managed deployment", "No jobs, scheduler, or Reverb"],
    tone: "lavender",
  },
  {
    name: "Starter",
    body: "For student applications that need background work or scheduled tasks.",
    price: "₱20",
    features: ["2 Laravel sites", "Jobs and scheduler for 1 site", "No Reverb"],
    tone: "white",
  },
  {
    name: "Pro",
    body: "For larger projects that need more sites and real-time application features.",
    price: "₱34",
    features: ["3 Laravel sites", "Jobs and scheduler for 2 sites", "Reverb for 2 sites"],
    tone: "cream",
  },
  {
    name: "Premium",
    body: "For complete projects with a separate Node.js frontend and Laravel backend.",
    price: "₱49",
    features: ["5 Laravel sites", "1 Node.js + Laravel site", "Jobs, scheduler, and Reverb"],
    tone: "dark",
  },
];

const springEase = [0.22, 1, 0.36, 1] as const;

const sectionReveal = {
  initial: { opacity: 0, y: 42 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.7, ease: springEase },
};

const softPop = {
  initial: { opacity: 0, scale: 0.96 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55, ease: springEase },
};

function LogoMark() {
  return (
    <div className="flex items-center gap-3 text-[22px] font-semibold tracking-[-0.01em] text-[#2F4156]">
      <div className="relative size-8 overflow-hidden rounded-[4px] bg-[#2F4156]">
        <div className="absolute bottom-0 left-1/2 h-8 w-3 -translate-x-1/2 rotate-45 bg-white" />
        <div className="absolute right-1 top-1 h-5 w-3 -rotate-45 bg-white" />
      </div>
      <span>BerryPanel</span>
    </div>
  );
}

function PillButton({
  children,
  dark = false,
  className = "",
  onClick,
  href,
}: {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const classes = `inline-flex h-11 items-center justify-center rounded-full border px-5 text-[18px] leading-none transition ${
    dark
      ? "border-[#2F4156] bg-[#2F4156] text-white"
      : "border-[#567C8D] bg-white/80 text-[#2F4156]"
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-8 py-7 md:px-12">
      <div className="flex items-center gap-2">
        <LogoMark />
      </div>
      <div className="flex itemss-center gap-2">
        <PillButton href="/login" className="hidden">Login</PillButton>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="grid size-11 place-items-center rounded-full border border-[#2F4156] bg-[#2F4156] text-white"
        >
          <Menu className="size-6" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

function MenuOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-[#2F4156]/25 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.aside
            className="relative h-full max-w-[780px] rounded-r-[36px] bg-white px-12 py-11 shadow-2xl md:rounded-r-[48px] md:px-16"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.55, ease: springEase }}
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={onClose}
              className="grid size-12 place-items-center rounded-full border border-[#567C8D] text-[#2F4156]"
            >
              <X className="size-7" />
            </button>
            <nav className="mt-32 flex flex-col gap-7 text-[52px] font-normal leading-[0.95] tracking-[-0.05em] text-[#2F4156] md:text-[72px]">
              {navItems.map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={onClose}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + index * 0.04 }}
                >
                  {item}
                </motion.a>
              ))}
            </nav>
            <div className="absolute bottom-12 left-12 flex items-center gap-3 text-[18px] text-[#567C8D] md:left-16">
              <PillButton href="/login">Login</PillButton>
              <PillButton href="/register" dark>
                Register
              </PillButton>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StudentHeroVisual() {
  return (
    <div className="relative min-h-[620px] overflow-hidden bg-[#C8D9E6] md:min-h-[760px]">
      <Image
        src="/images/student-hosting-hero.png"
        alt="Students collaborating on a web application project"
        fill
        priority
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/60 bg-white/88 p-5 shadow-xl backdrop-blur md:inset-x-8 md:bottom-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#567C8D]">Built for student projects</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#2F4156]">From GitHub repository to a shareable website.</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#2F4156] text-white"><Rocket className="size-5" /></span>
        </div>
      </div>
    </div>
  );
}

function HeroCard() {
  return (
    <motion.section
      id="home"
      className="grid min-h-[760px] grid-cols-1 overflow-hidden bg-white md:grid-cols-[1fr_1fr]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative flex min-h-[720px] flex-col justify-between px-8 pb-8 pt-28 md:px-12 md:pt-32">
        <div className="mt-16 max-w-[720px] md:mt-20">
          <h1 className="text-[56px] font-normal leading-[0.92] tracking-[-0.065em] text-[#2F4156] md:text-[72px] xl:text-[76px]">
            Your Student Project
            <br />
            Deserves To Go{" "}
            <span className="relative inline-block rounded-xl bg-[#C8D9E6] px-3">
              Live
            </span>
          </h1>
          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-[410px] text-[22px] leading-[1.05] tracking-[-0.035em] text-[#567C8D]">
              Affordable Laravel hosting crafted for students, capstone teams,
              portfolios, and the projects you are ready to share.
            </p>
            <PillButton href="/register" dark className="h-14 min-w-40">
              Get Started
            </PillButton>
          </div>
        </div>
        <div className="mt-24 grid max-w-[760px] gap-5 md:grid-cols-[1fr_0.42fr]">
          <div className="relative min-h-[140px] rounded-[20px] bg-[#F1F1F1] p-7">
            <div className="absolute -top-8 left-24 grid size-28 place-items-center rounded-[22px] bg-[#C8D9E6] text-[68px] font-bold text-white">
              B
            </div>
            <div className="absolute right-5 top-5 grid size-12 place-items-center rounded-full bg-white">
              <ArrowUpRight className="size-6" />
            </div>
            <div className="mt-14 flex items-end justify-between">
              <span className="text-[25px] tracking-[-0.04em] text-[#2F4156]">
                Your Website Is Ready
              </span>
              <ArrowRight className="size-7" />
            </div>
          </div>
          <div className="rounded-[20px] bg-[#F1F1F1] p-5">
            <div className="flex -space-x-3">
              {["BP", "WEB", "SSL"].map((item) => (
                <div
                  key={item}
                  className="grid size-11 place-items-center rounded-full border-2 border-white bg-[#C8D9E6] text-xs"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[15px] leading-tight text-[#567C8D]">
              Everything you needs in one simple workspace
            </p>
          </div>
        </div>
      </div>
      <StudentHeroVisual />
    </motion.section>
  );
}

function SplitStatement() {
  return (
    <motion.section
      className="min-h-fit bg-white px-8 py-28 text-center"
      {...sectionReveal}
    >
      <h2 className="mx-auto max-w-[1080px] text-[62px] font-normal leading-[1.18] tracking-[-0.06em] text-[#2F4156] md:text-[88px]">
        Hosting That Meets Students
        <br />
        In{" "}
        <span className="rounded-xl bg-[#F1F1F1] px-3">
          Where They Are
        </span>
      </h2>
      <p className="mx-auto mt-10 max-w-[540px] text-[20px] leading-[1.08] tracking-[-0.035em] text-[#567C8D]">
        Start free, connect a GitHub repository, and learn how a real Laravel
        application moves from development to the web.
      </p>
    </motion.section>
  );
}

function PerformanceSection() {
  return (
    <motion.section
      id="hosting"
      className="bg-white px-8 py-32 md:px-14"
      {...sectionReveal}
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-4">
          <span className="rounded-full bg-[#F1F1F1] px-6 py-3 text-[18px] text-[#567C8D]">
            Localhost To Live
          </span>
          <Clock3 className="size-9 text-[#567C8D]" />
        </div>
        <h2 className="mx-auto max-w-[780px] text-[58px] font-normal leading-[1.05] tracking-[-0.06em] text-[#2F4156] md:text-[76px]">
          Your Project Should Not Stay On Your Laptop.
        </h2>
        <p className="mx-auto mt-7 max-w-[680px] text-[20px] leading-[1.2] tracking-[-0.03em] text-[#567C8D]">
          BerryPanel turns a Laravel project that only works locally into a
          real website your classmates, professors, clients, and employers can
          open online.
        </p>
      </div>
      <motion.div
        className="relative mx-auto mt-16 max-w-[1180px] overflow-hidden rounded-[30px] bg-[#F1F1F1] shadow-[0_22px_70px_rgba(47,65,86,0.12)]"
        {...softPop}
      >
        <div className="relative aspect-[16/9] min-h-[390px]">
          <Image
            src="/images/localhost-to-live-comparison.png"
            alt="A student project running locally compared with the same project published online"
            fill
            sizes="(min-width: 1280px) 1180px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/55 via-transparent to-transparent" />
          <div className="absolute inset-x-5 top-5 grid grid-cols-2 gap-5 md:inset-x-8 md:top-8">
            <span className="w-fit rounded-full bg-white/90 px-5 py-3 text-sm font-medium text-[#2F4156] shadow-lg backdrop-blur md:text-base">
              Local development
            </span>
            <span className="ml-auto w-fit rounded-full bg-[#caff80] px-5 py-3 text-sm font-medium text-[#2F4156] shadow-lg md:text-base">
              Live on the internet
            </span>
          </div>
        </div>
        <div className="grid md:grid-cols-2">
          <div className="border-b border-[#D6E1E8] p-7 md:border-b-0 md:border-r md:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#567C8D]">
              Before publishing
            </p>
            <h3 className="mt-3 text-[30px] leading-none tracking-[-0.045em] text-[#2F4156]">
              It only works on your computer
            </h3>
            <p className="mt-4 max-w-[470px] text-base leading-relaxed text-[#567C8D]">
              Localhost is useful while building, but nobody else can visit the
              project unless your development computer is running.
            </p>
          </div>
          <div className="bg-white p-7 md:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#567C8D]">
              After publishing
            </p>
            <h3 className="mt-3 text-[30px] leading-none tracking-[-0.045em] text-[#2F4156]">
              It is online and ready to share
            </h3>
            <p className="mt-4 max-w-[470px] text-base leading-relaxed text-[#567C8D]">
              BerryPanel deploys the repository, assigns an address, and keeps
              the application available from phones, laptops, and other devices.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

function FeatureSection() {
  return (
    <motion.section
      id="features"
      className="overflow-hidden bg-white px-6 py-24 md:px-14 md:py-28"
      {...sectionReveal}
    >
      <div className="mx-auto max-w-[760px] text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#567C8D]">
          Core Features
        </p>
        <h2 className="mt-5 text-[48px] font-normal leading-[0.98] tracking-[-0.06em] text-[#2F4156] md:text-[68px]">
          Everything Your Project Needs
        </h2>
        <p className="mx-auto mt-6 max-w-[570px] text-lg leading-relaxed text-[#6C7D91] md:text-xl">
          From a GitHub repository to a live, managed Laravel application.
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-[1240px] gap-7 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </motion.section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <motion.article
      className="group relative flex min-h-[500px] flex-col overflow-hidden rounded-[28px] border border-[#DCE5EB] bg-[#F7FAFB] shadow-[0_24px_60px_rgba(47,65,86,0.08)]"
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ duration: 0.25 }}
    >
      <FeatureVisual kind={feature.visual} />
      <div className="relative z-10 flex flex-1 flex-col justify-end bg-white px-8 py-8">
        <h3 className="text-[31px] leading-none tracking-[-0.05em] text-[#2F4156]">
          {feature.title}
        </h3>
        <p className="mt-4 max-w-[330px] text-[17px] leading-relaxed tracking-[-0.025em] text-[#6C7D91]">
          {feature.body}
        </p>
      </div>
    </motion.article>
  );
}

function FeatureVisual({ kind }: { kind: Feature["visual"] }) {
  if (kind === "deploy") {
    return (
      <div className="relative flex h-[320px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_15%,#FFFFFF_0,transparent_35%),linear-gradient(145deg,#E8F0F5_0%,#C8D9E6_52%,#9FB9C7_100%)] p-7">
        <div className="absolute -left-16 top-20 size-48 rounded-full border border-white/45" />
        <div className="relative w-full max-w-[310px] rounded-[22px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_60px_rgba(47,65,86,0.15)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[#DCE5EB] pb-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#2F4156]">
              <Code2 className="size-4 text-[#567C8D]" />
              student-project
            </span>
            <span className="rounded-full bg-[#E7F5ED] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#2F7D54]">
              main
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {["Repository connected", "Application prepared", "Website published"].map((label, index) => (
              <div key={label} className="flex items-center gap-3 text-xs text-[#567C8D]">
                <span className={`grid size-6 place-items-center rounded-full ${index === 2 ? "bg-[#2F4156] text-white" : "bg-[#DCEFE5] text-[#2F7D54]"}`}>
                  {index === 2 ? <Rocket className="size-3.5" /> : <span className="size-2 rounded-full bg-current" />}
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (kind === "workspace") {
    return (
      <div className="relative flex h-[320px] items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#DDE9F0_0%,#B8CFDC_50%,#7FA0B0_100%)] p-7">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative grid size-24 place-items-center rounded-full border-8 border-white/60 bg-[#2F4156] text-white shadow-xl">
          <span className="text-xl font-semibold tracking-[-0.05em]">BP</span>
        </div>
        <div className="absolute left-6 top-7 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-[#2F4156] shadow-lg backdrop-blur-md">
          <Globe2 className="size-5 text-[#567C8D]" /> Sites
          <span className="size-2 rounded-full bg-emerald-500" />
        </div>
        <div className="absolute right-5 top-20 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-[#2F4156] shadow-lg backdrop-blur-md">
          <Database className="size-5 text-[#567C8D]" /> Databases
          <span className="size-2 rounded-full bg-emerald-500" />
        </div>
        <div className="absolute bottom-7 left-10 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-[#2F4156] shadow-lg backdrop-blur-md">
          <Globe2 className="size-5 text-[#567C8D]" /> Domains
          <span className="size-2 rounded-full bg-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[320px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_70%_15%,#F7FBFD_0,transparent_28%),linear-gradient(145deg,#C8D9E6_0%,#AFC6D2_52%,#718FA0_100%)] p-7">
      <div className="absolute -right-14 -top-14 size-48 rounded-full border-[28px] border-white/25" />
      <div className="relative w-full max-w-[310px] space-y-3 rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_22px_60px_rgba(47,65,86,0.14)] backdrop-blur-md">
        {[
          { label: "Background jobs", icon: ServerCog },
          { label: "Scheduled tasks", icon: Clock3 },
          { label: "Realtime updates", icon: Zap },
        ].map(({ label, icon: Icon }, index) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/75 p-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#E5EEF4] text-[#2F4156]">
              <Icon className="size-4" />
            </span>
            <span className="flex-1 text-sm font-medium text-[#2F4156]">{label}</span>
            <span className={`relative h-5 w-9 rounded-full ${index === 1 ? "bg-[#9FB9C7]" : "bg-[#567C8D]"}`}>
              <span className="absolute right-1 top-1 size-3 rounded-full bg-white shadow" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  return (
    <motion.section
      id="students"
      className="bg-white px-5 py-20 md:px-10 md:py-24"
      {...sectionReveal}
    >
      <div className="relative mx-auto min-h-[760px] max-w-[1380px] overflow-hidden rounded-[40px] border border-[#DCE5EB] bg-[#F8FAFB] px-6 py-20 shadow-[0_28px_80px_rgba(47,65,86,0.08)] md:px-12">
        <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(#C8D9E6_1.2px,transparent_1.2px)] [background-size:22px_22px]" />
        <div className="absolute -left-28 top-1/2 size-72 -translate-y-1/2 rounded-full border-[34px] border-[#C8D9E6]/25" />
        <div className="absolute -right-20 top-10 size-64 rounded-full border-[32px] border-[#567C8D]/10" />

        <div className="relative z-20 mx-auto flex max-w-[760px] flex-col items-center text-center md:pt-28">
          <span className="grid size-16 place-items-center rounded-2xl bg-[#2F4156] text-white shadow-[0_16px_32px_rgba(47,65,86,0.22)]">
            <Users className="size-8" />
          </span>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-[#567C8D]">
            Made For Students
          </p>
          <h2 className="mt-5 text-[48px] font-normal leading-[0.98] tracking-[-0.06em] text-[#2F4156] md:text-[72px]">
            Build, Publish, And Share
            <span className="block text-[#718FA0]">Every Student Project</span>
          </h2>
          <p className="mx-auto mt-7 max-w-[600px] text-lg leading-relaxed text-[#6C7D91] md:text-xl">
            Take your capstone, portfolio, or classroom application from GitHub to a live address without managing an entire server.
          </p>
          <PillButton href="/register" dark className="mt-8 h-14 min-w-44">
            Start For Free
          </PillButton>
        </div>

        <motion.div
          className="relative z-10 mt-14 rounded-[26px] border border-[#C8D9E6] bg-white/90 p-5 shadow-xl backdrop-blur-md md:absolute md:left-7 md:top-7 md:mt-0 md:w-[270px] md:-rotate-3"
          whileHover={{ rotate: 0, y: -6 }}
        >
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-xl bg-[#E5EEF4] text-[#2F4156]">
              <CloudUpload className="size-5" />
            </span>
            <span className="rounded-full bg-[#E8F4ED] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#2F7D54]">Live</span>
          </div>
          <p className="mt-5 text-sm font-semibold text-[#2F4156]">Capstone deployment</p>
          <p className="mt-1 text-xs leading-relaxed text-[#6C7D91]">Repository connected and published successfully.</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E5EEF4]"><div className="h-full w-full rounded-full bg-[#567C8D]" /></div>
        </motion.div>

        <motion.div
          className="relative z-10 mt-5 rounded-[26px] border border-[#C8D9E6] bg-[#E5EEF4]/95 p-5 shadow-xl backdrop-blur-md md:absolute md:right-7 md:top-8 md:mt-0 md:w-[270px] md:rotate-3"
          whileHover={{ rotate: 0, y: -6 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#2F4156]">Project-ready stacks</p>
            <Code2 className="size-5 text-[#567C8D]" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-medium text-[#2F4156]">
            {["Blade", "Inertia", "Livewire", "Filament"].map((stack) => (
              <span key={stack} className="rounded-xl bg-white/80 px-3 py-2.5 text-center">{stack}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative z-10 mt-5 rounded-[26px] border border-[#C8D9E6] bg-white/90 p-5 shadow-xl backdrop-blur-md md:absolute md:bottom-7 md:left-9 md:mt-0 md:w-[300px] md:rotate-2"
          whileHover={{ rotate: 0, y: -6 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#2F4156]">Your projects</p>
            <span className="text-xs text-[#567C8D]">2 online</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {["Portfolio website", "Final capstone"].map((project, index) => (
              <div key={project} className="flex items-center gap-3 rounded-xl bg-[#F4F7F9] p-3">
                <span className="grid size-8 place-items-center rounded-lg bg-[#C8D9E6] text-xs font-semibold text-[#2F4156]">{index + 1}</span>
                <span className="flex-1 text-xs font-medium text-[#2F4156]">{project}</span>
                <span className="size-2 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative z-10 mt-5 rounded-[26px] border border-[#6F8FA0] bg-[#2F4156] p-5 text-white shadow-xl md:absolute md:bottom-7 md:right-8 md:mt-0 md:w-[300px] md:-rotate-2"
          whileHover={{ rotate: 0, y: -6 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Grow when ready</p>
            <Rocket className="size-5 text-[#C8D9E6]" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/65">Add more application services only when your project needs them.</p>
          <div className="mt-4 flex gap-2">
            {["Jobs", "Reverb", "Node.js"].map((service) => (
              <span key={service} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-medium text-white/85">{service}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function ProcessSection() {
  return (
    <motion.section
      id="process"
      className="bg-[#F6F7F8] px-6 py-20 md:px-14 md:py-24"
      {...sectionReveal}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[14px] font-medium uppercase tracking-[0.22em] text-[#567C8D]">
              A clear path to launch
            </span>
            <h2 className="mt-4 max-w-[850px] text-[50px] font-normal leading-[0.95] tracking-[-0.06em] text-[#2F4156] md:text-[72px]">
              Getting Your Website Live Is Simple
            </h2>
          </div>
          <span className="w-fit rounded-full border border-[#DCE4E8] bg-white px-5 py-3 text-[15px] text-[#567C8D] shadow-sm">
            Four guided steps
          </span>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-[0.86fr_1fr_1fr] lg:grid-rows-[240px_300px]">
          {processSteps.map((item, index) => (
          <motion.article
            key={item.step}
            className={`group relative flex min-h-[280px] overflow-hidden rounded-[28px] border border-[#E1E7EA] bg-white p-7 shadow-[0_18px_50px_rgba(47,65,86,0.06)] md:p-9 ${
              index === 0
                ? "lg:row-span-2 lg:min-h-0 lg:items-end"
                : index === 1
                  ? "lg:col-span-2 lg:min-h-0 lg:items-start"
                  : "lg:min-h-0 lg:items-end"
            }`}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className={`pointer-events-none absolute text-[#C8D9E6] transition duration-500 group-hover:scale-105 group-hover:text-[#B7CDDC] ${
                index === 0
                  ? "left-8 top-9"
                  : index === 1
                    ? "bottom-5 right-10"
                    : "right-7 top-7"
              }`}
            >
              <item.icon
                className={index === 1 ? "size-32 md:size-40" : "size-24 md:size-28"}
                strokeWidth={1.15}
              />
            </div>

            <div
              className={`relative z-10 flex w-full flex-col ${
                index === 1
                  ? "max-w-[720px]"
                  : index === 0
                    ? "mt-36"
                    : "mt-24"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#7C98A5]">
                  {item.step}
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-[#EDF3F6] text-[13px] font-medium text-[#567C8D]">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-5 text-[29px] leading-[0.98] tracking-[-0.05em] text-[#2F4156] md:text-[34px]">
                {item.title}
              </h3>
              <p
                className={`mt-4 text-[17px] leading-[1.25] tracking-[-0.025em] text-[#567C8D] ${
                  index === 1 ? "max-w-[580px]" : "max-w-[360px]"
                }`}
              >
                {item.body}
              </p>
            </div>
          </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function PricingSection() {
  return (
    <motion.section
      id="plans"
      className="bg-white px-8 py-16 md:px-14"
      {...sectionReveal}
    >
      <div className="mx-auto max-w-[900px] text-center">
          <div className="inline-flex items-center gap-4">
            <span className="rounded-full bg-[#F1F1F1] px-6 py-3 text-[18px]">
              Student-Friendly Monthly Plans
            </span>
            <CircleDollarSign className="size-9 text-[#567C8D]" />
          </div>
          <h2 className="mt-9 text-[58px] font-normal leading-none tracking-[-0.06em] text-[#2F4156] md:text-[76px]">
            Start Free. Upgrade When Your Project Needs More.
          </h2>
      </div>
      <div className="mx-auto mt-20 grid max-w-[1280px] gap-7 lg:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>
    </motion.section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const styles = {
    lavender: "bg-[#C8D9E6]",
    white: "bg-white border border-[#C8D9E6]",
    cream: "bg-[#F1F1F1]",
    dark: "bg-[#2F4156] text-white",
  };

  return (
    <motion.article
      className={`relative min-h-[500px] overflow-hidden rounded-[26px] p-10 text-center ${styles[plan.tone]}`}
      whileHover={{ y: -10, scale: 1.01 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 text-[460px] font-semibold leading-none text-white/24">
        B
      </div>
      <div className="relative z-10 flex h-full min-h-[420px] flex-col items-center justify-between">
        <span className="rounded-full border border-[#567C8D] bg-white/40 px-8 py-3 text-[20px]">
          Monthly
        </span>
        <div>
          <h3 className="text-[52px] leading-none tracking-[-0.06em]">
            {plan.name}
          </h3>
          <p className={`mx-auto mt-8 max-w-[360px] text-[23px] leading-[1.05] tracking-[-0.045em] ${plan.tone === "dark" ? "text-white/75" : "text-[#567C8D]"}`}>
            {plan.body}
          </p>
          <ul className={`mx-auto mt-7 max-w-[360px] space-y-2 text-left text-sm ${plan.tone === "dark" ? "text-white/80" : "text-[#567C8D]"}`}>
            {plan.features.map((feature) => <li key={feature} className="flex items-center gap-2"><span className={`size-2 rounded-full ${plan.tone === "dark" ? "bg-[#C8D9E6]" : "bg-[#567C8D]"}`} />{feature}</li>)}
          </ul>
        </div>
        <div className="flex w-full items-center justify-center gap-6">
          <span className="rounded-full bg-white px-9 py-5 text-[38px] leading-none tracking-[-0.06em] text-[#2F4156]">
            {plan.price}
            <span className="ml-4 text-[18px] tracking-[-0.03em] text-[#567C8D]">
              / month
            </span>
          </span>
          <span className="grid size-20 place-items-center rounded-full bg-white text-[#2F4156]">
            <ArrowUpRight className="size-11" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function FinalCta() {
  const tags = [
    "WEBSITES",
    "DOMAINS",
    "UPDATES",
    "FEATURES",
    "ACTIVITY",
    "SUPPORT",
    "LAUNCH",
    "SECURITY",
    "TOOLS",
  ];

  return (
    <motion.section
      className="relative min-h-[620px] overflow-hidden bg-[#C8D9E6] px-8 py-28 text-center"
      {...sectionReveal}
    >
      <div className="mx-auto flex w-fit gap-4">
        <span className="grid size-12 place-items-center rounded-full bg-white text-[#567C8D]">
          <ServerCog className="size-6" />
        </span>
        <span className="grid size-12 place-items-center rounded-full bg-white text-[#567C8D]">
          <Globe2 className="size-6" />
        </span>
      </div>
      <h2 className="relative z-10 mx-auto mt-10 max-w-[900px] text-[56px] font-normal leading-[1.08] tracking-[-0.06em] text-[#2F4156] md:text-[76px]">
        Your Capstone, Portfolio, Or Next Big Idea
        <br />
        Can Go Live Here
      </h2>
      <PillButton
        href="/register"
        dark
        className="relative z-10 mt-12 h-14 min-w-40"
      >
        Get Started
      </PillButton>
      <div className="absolute inset-x-0 bottom-[-120px] text-[260px] font-semibold leading-none tracking-[-0.1em] text-white/75 md:text-[360px]">
        BerryPanel
      </div>
      <div className="absolute left-1/2 top-[58%] hidden h-56 w-[760px] -translate-x-1/2 -translate-y-1/2 md:block">
        {tags.map((tag, index) => (
          <motion.span
            key={tag}
            className={`absolute rounded-full px-8 py-4 text-[18px] shadow-sm ${
              index % 2 === 0 ? "bg-[#F1F1F1]" : "bg-white"
            }`}
            initial={{ y: 24, opacity: 0, rotate: 0 }}
            whileInView={{
              y: 0,
              opacity: 1,
              rotate: index % 2 === 0 ? -14 : 24,
            }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04, duration: 0.45 }}
            style={{
              left: `${(index * 83) % 620}px`,
              top: `${(index * 47) % 160}px`,
            }}
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white font-sans text-[#2F4156]">
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="relative flex flex-col">
        <Header onMenu={() => setMenuOpen(true)} />
        <HeroCard />
        <PerformanceSection />
        <FeatureSection />
        <TestimonialsSection />
        <ProcessSection />
        <PricingSection />
        <FinalCta />
      </div>
    </main>
  );
}
