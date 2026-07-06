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
import Link from "next/link";
import { useState } from "react";

type Feature = {
  title: string;
  body: string;
  tone: "cream" | "image" | "lavender" | "dark";
};

type Testimonial = {
  name: string;
  role: string;
  quote: string;
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
  tone: "lavender" | "white" | "cream";
};

const navItems = [
  "Home",
  "Hosting",
  "Laravel",
  "Customers",
  "Process",
  "Solutions",
  "Plans",
];

const features: Feature[] = [
  {
    title: "Ship Laravel Fast",
    body: "Provision a user, database, PHP-FPM pool, and Nginx route without repeating the same server checklist.",
    tone: "cream",
  },
  {
    title: "Explore The Panel",
    body: "See sites, deploy history, database access, and server health from one focused dashboard.",
    tone: "image",
  },
  {
    title: "Make Your Site Work",
    body: "Designed for Laravel with Inertia, Vite assets, storage links, migrations, and production cache flows.",
    tone: "lavender",
  },
  {
    title: "Optimize Your Stack",
    body: "Keep queues, Reverb, logs, and deploy scripts controlled by BerryPanel instead of random shell commands.",
    tone: "dark",
  },
];

const testimonials: Testimonial[] = [
  {
    name: "Mika Reyes",
    role: "Laravel developer",
    quote:
      "BerryPanel gives me a clean place to upload, configure, and run a Laravel app without needing full server access every time.",
  },
  {
    name: "Andre Santos",
    role: "Founder, small studio",
    quote:
      "The shared hosting flow feels simple: database, domain, deploy, and logs are all visible in one panel.",
  },
  {
    name: "Nia Castillo",
    role: "Inertia app builder",
    quote:
      "I can build locally, push to Git, and let the server handle composer, Vite builds, migrations, and cache refreshes.",
  },
  {
    name: "Luis Tan",
    role: "Project owner",
    quote:
      "It is perfect for small production apps where we want real hosting control without renting a large VPS.",
  },
];

const processSteps: ProcessStep[] = [
  {
    icon: CloudUpload,
    title: "Submit your app",
    body: "Add the Laravel repository, branch, site name, and preferred domain or subdomain.",
    step: "Step 1",
  },
  {
    icon: Code2,
    title: "Prepare hosting",
    body: "BerryPanel creates the Linux user, site path, database, PHP-FPM pool, and Nginx config.",
    step: "Step 2",
  },
  {
    icon: Database,
    title: "Deploy the build",
    body: "Composer, npm build, migrations, storage links, and Laravel caches run in a controlled flow.",
    step: "Step 3",
  },
  {
    icon: Rocket,
    title: "Launch the site",
    body: "Reload the services, attach the domain, and keep logs available for quick diagnosis.",
    step: "Step 4",
  },
];

const plans: Plan[] = [
  {
    name: "Static",
    body: "For portfolios, landing pages, and simple public websites with SFTP upload.",
    price: "Free",
    tone: "lavender",
  },
  {
    name: "Laravel",
    body: "For Inertia apps with PHP-FPM isolation, one database, deploy logs, and storage.",
    price: "Private",
    tone: "white",
  },
  {
    name: "Managed",
    body: "For trusted apps that need queues, Reverb, scheduled jobs, and domain support.",
    price: "Invite",
    tone: "cream",
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
    <div className="flex items-center gap-3 text-[22px] font-semibold tracking-[-0.01em] text-[#121212]">
      <div className="relative size-8 overflow-hidden rounded-[4px] bg-black">
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
      ? "border-black bg-black text-white"
      : "border-[#767676] bg-white/80 text-[#202020]"
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
        <PillButton onClick={onMenu}>Menu</PillButton>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="grid size-11 place-items-center rounded-full border border-black bg-black text-white"
        >
          <Menu className="size-6" strokeWidth={2} />
        </button>
        <PillButton href="/login">Login</PillButton>
      </div>
      <div className="hidden md:block">
        <LogoMark />
      </div>
      <div className="hidden items-center gap-3 text-[18px] text-[#5d5d5d] md:flex">
        <span className="grid size-11 place-items-center rounded-full border border-[#767676] text-[#1c1c1c]">
          EN
        </span>
        <span>PH</span>
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
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px]"
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
              className="grid size-12 place-items-center rounded-full border border-[#777] text-[#303030]"
            >
              <X className="size-7" />
            </button>
            <nav className="mt-32 flex flex-col gap-7 text-[52px] font-normal leading-[0.95] tracking-[-0.05em] text-[#111] md:text-[72px]">
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
            <div className="absolute bottom-12 left-12 flex items-center gap-3 text-[18px] text-[#676767] md:left-16">
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

function BrowserMock() {
  return (
    <div className="relative h-full min-h-[640px] overflow-hidden rounded-[28px] bg-[#cfc8eb] md:rounded-[34px]">
      <div className="absolute left-7 top-20 flex gap-4">
        <div className="grid size-12 place-items-center rounded-full bg-white text-[#5e5e5e]">
          <ServerCog className="size-6" />
        </div>
        <div className="grid size-12 place-items-center rounded-full bg-white text-[#5e5e5e]">
          <Globe2 className="size-6" />
        </div>
      </div>
      <motion.div
        className="absolute bottom-0 left-[13%] h-[34%] w-[68%] rounded-t-[18px] bg-gradient-to-b from-[#111] to-[#333]"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.25, ease: springEase }}
      />
      <motion.div
        className="absolute bottom-[25%] right-[-2%] h-[300px] w-[58%] rotate-[-7deg] rounded-[20px] border-[10px] border-black bg-white shadow-2xl"
        initial={{ x: 80, rotate: -13, opacity: 0 }}
        animate={{ x: 0, rotate: -7, opacity: 1 }}
        transition={{ duration: 0.85, delay: 0.35, ease: springEase }}
      >
        <div className="h-full overflow-hidden rounded-[10px] bg-[#f4f4f4]">
          <div className="h-[44%] bg-[linear-gradient(135deg,#111,#777)] opacity-75" />
          <div className="space-y-3 p-5">
            <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
              Laravel Ready
            </span>
            <div className="text-[34px] leading-[0.95] tracking-[-0.06em]">
              Provisioned
              <br />
              Hosting
            </div>
            <div className="flex items-center gap-2">
              <div className="h-12 w-20 rounded-xl bg-[#d8cef2]" />
              <div className="h-12 w-20 rounded-xl bg-white" />
              <div className="h-12 w-20 rounded-xl bg-[#fff0b8]" />
            </div>
          </div>
        </div>
      </motion.div>
      <div className="absolute bottom-7 right-8 flex items-center gap-4 rounded-full bg-white/95 p-3 shadow-xl">
        {["DB", "PHP", "SSL"].map((item, index) => (
          <div
            key={item}
            className={`grid size-16 place-items-center rounded-full text-[15px] font-medium ${
              index === 0
                ? "border-[5px] border-black bg-[#d8cef2]"
                : "bg-[#e9e9e9]"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
      <div className="absolute bottom-10 left-[47%] flex items-center gap-4 text-white">
        <span className="grid size-11 place-items-center rounded-full border border-white/70">
          +
        </span>
        <span className="text-[22px] leading-[1.05] text-white/80">
          Explore our
          <br />
          hosted projects
        </span>
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
          <h1 className="text-[56px] font-normal leading-[0.92] tracking-[-0.065em] text-[#080808] md:text-[82px] xl:text-[92px]">
            Make Laravel Sites
            <br />
            Work{" "}
            <span className="relative inline-block rounded-xl bg-[#d8cef2] px-3">
              on Pi
              <span className="absolute -right-4 bottom-0 -z-0 h-full w-8 rounded-r-xl bg-[#ffef9d]" />
            </span>
          </h1>
          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-[410px] text-[22px] leading-[1.05] tracking-[-0.035em] text-[#555]">
              A tiny control panel for provisioning Laravel, Inertia, databases,
              and deploys on your own server.
            </p>
            <PillButton href="/register" dark className="h-14 min-w-40">
              Get Started
            </PillButton>
          </div>
        </div>
        <div className="mt-24 grid max-w-[760px] gap-5 md:grid-cols-[1fr_0.42fr]">
          <div className="relative min-h-[140px] rounded-[20px] bg-[#f5f5f5] p-7">
            <div className="absolute -top-8 left-24 grid size-28 place-items-center rounded-[22px] bg-[#d8cef2] text-[68px] font-bold text-white">
              B
            </div>
            <div className="absolute right-5 top-5 grid size-12 place-items-center rounded-full bg-white">
              <ArrowUpRight className="size-6" />
            </div>
            <div className="mt-14 flex items-end justify-between">
              <span className="text-[25px] tracking-[-0.04em] text-[#333]">
                Laravel Provisioning Test
              </span>
              <ArrowRight className="size-7" />
            </div>
          </div>
          <div className="rounded-[20px] bg-[#f5f5f5] p-5">
            <div className="flex -space-x-3">
              {["BP", "DB", "NG"].map((item) => (
                <div
                  key={item}
                  className="grid size-11 place-items-center rounded-full border-2 border-white bg-[#d8cef2] text-xs"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 text-[30px] leading-none tracking-[-0.05em]">
              5+
            </div>
            <p className="mt-2 text-[15px] leading-tight text-[#555]">
              Friendly sites ready for one Raspberry Pi
            </p>
          </div>
        </div>
      </div>
      <BrowserMock />
    </motion.section>
  );
}

function SplitStatement() {
  return (
    <motion.section
      className="min-h-[620px] bg-white px-8 py-28 text-center"
      {...sectionReveal}
    >
      <h2 className="mx-auto max-w-[1080px] text-[62px] font-normal leading-[1.18] tracking-[-0.06em] text-[#101010] md:text-[88px]">
        Local Laravel Hosting
        <br />
        Without the{" "}
        <span className="rounded-xl bg-[#f4f4f4] px-3">
          heavy VPS bill
        </span>
      </h2>
      <p className="mx-auto mt-10 max-w-[540px] text-[20px] leading-[1.08] tracking-[-0.035em] text-[#555]">
        Build the hosting flow once, then let BerryPanel repeat it for every
        trusted Laravel and Inertia project.
      </p>
    </motion.section>
  );
}

function PerformanceSection() {
  return (
    <motion.section
      id="hosting"
      className="bg-white px-8 py-14 md:px-14"
      {...sectionReveal}
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-4">
          <span className="rounded-full bg-[#f6f6f6] px-6 py-3 text-[18px] text-[#555]">
            Provisioning Speed
          </span>
          <Clock3 className="size-9 text-[#676767]" />
        </div>
        <h2 className="mx-auto mt-10 max-w-[780px] text-[58px] font-normal leading-[1.05] tracking-[-0.06em] text-[#111] md:text-[76px]">
          Does Your Server Deploy Laravel Cleanly?
        </h2>
      </div>
      <div className="relative mx-auto mt-16 grid max-w-[1180px] gap-6 md:grid-cols-2">
        <CompareCard label="Before BerryPanel" time="Manual" slow />
        <div className="absolute left-1/2 top-1/2 z-10 hidden size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[28px] tracking-[-0.04em] text-[#555] shadow-lg md:grid">
          00:01
        </div>
        <CompareCard label="After BerryPanel" time="3.1s" />
      </div>
    </motion.section>
  );
}

function CompareCard({
  label,
  time,
  slow = false,
}: {
  label: string;
  time: string;
  slow?: boolean;
}) {
  return (
    <motion.div
      className="min-h-[440px] min-w-0 rounded-[22px] bg-white p-6 shadow-[0_0_35px_rgba(0,0,0,0.035)] md:p-8"
      {...softPop}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[#fff0b8] px-6 py-3 text-[18px]">
          {label}
        </span>
        <span
          className={`grid size-14 place-items-center rounded-full text-[18px] ${
            slow ? "bg-[#fafafa]" : "bg-[#caff80]"
          }`}
        >
          {time}
        </span>
      </div>
      <div className="mx-auto mt-14 h-72 max-w-[520px] rounded-[18px] bg-[#f8f8f8] p-8">
        {slow ? (
          <div className="mt-28 h-28 max-w-[330px] rounded-xl bg-[#ddd6f3] p-5">
            <div className="size-24 rounded-lg bg-white" />
          </div>
        ) : (
          <div className="h-full rounded-xl bg-white p-6">
            <div className="mb-12 flex justify-end gap-3">
              {["about", "deploy", "logs"].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[#f0f0f0] px-4 py-2 text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="grid gap-3">
              <div className="h-7 w-3/4 rounded-full bg-[#d8cef2]" />
              <div className="h-7 w-1/2 rounded-full bg-[#fff0b8]" />
              <div className="h-7 w-2/3 rounded-full bg-[#ededed]" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FeatureSection() {
  return (
    <motion.section
      id="laravel"
      className="overflow-hidden bg-white px-8 py-14 md:px-14"
      {...sectionReveal}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-5 text-[#c6c6c6]">
          <CircleHelp className="size-7" />
          <Share2 className="size-7" />
        </div>
        <h2 className="text-center text-[54px] font-normal leading-none tracking-[-0.06em] text-[#222] md:text-[72px]">
          That&apos;s Where We Come In
        </h2>
        <div className="hidden items-center gap-3 text-[20px] text-[#aaa] md:flex">
          Browse Features <ArrowDown className="size-5" />
        </div>
      </div>
      <div className="mt-20 grid gap-6 md:min-w-[1280px] md:grid-cols-[380px_380px_380px_380px]">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
      <div className="mt-16 flex justify-center gap-5">
        <PillButton href="/register" dark className="h-14 min-w-40">
          Get Started
        </PillButton>
        <PillButton href="/login" className="h-14 min-w-40">
          Login
        </PillButton>
      </div>
    </motion.section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const styles = {
    cream: "bg-[#fff0b8]",
    image: "bg-[#eeeeee]",
    lavender: "bg-[#d8cef2]",
    dark: "bg-[#202020] text-white",
  };

  return (
    <motion.article
      className={`relative h-[520px] overflow-hidden rounded-[26px] p-10 ${styles[feature.tone]}`}
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 text-[360px] font-semibold leading-none text-white/28">
        B
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-6">
          <h3 className="text-[38px] leading-[0.95] tracking-[-0.055em]">
            {feature.title}
          </h3>
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-black">
            {feature.tone === "cream" ? (
              <Clock3 className="size-7" />
            ) : (
              <Zap className="size-7" />
            )}
          </span>
        </div>
        <p className="max-w-[290px] text-[22px] leading-[1.05] tracking-[-0.045em]">
          {feature.body}
        </p>
      </div>
    </motion.article>
  );
}

function TestimonialsSection() {
  return (
    <motion.section
      id="customers"
      className="bg-white px-8 py-20 md:px-14"
      {...sectionReveal}
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-4">
          <span className="rounded-full bg-[#f6f6f6] px-6 py-3 text-[18px]">
            Our Customers
          </span>
          <Users className="size-9 text-[#777]" />
        </div>
        <h2 className="mt-10 text-[58px] font-normal leading-[1.02] tracking-[-0.06em] text-[#2b2b2b] md:text-[76px]">
          Don&apos;t Just Take
          <br />
          Our Word
        </h2>
      </div>
      <div className="mt-20 grid gap-7 md:grid-cols-4">
        {testimonials.map((item) => (
          <motion.article
            key={item.name}
            className="flex min-h-[430px] flex-col justify-between rounded-[24px] bg-[#f4f4f4] p-9"
            whileHover={{ y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div>
              <h3 className="text-[30px] tracking-[-0.05em]">{item.name}</h3>
              <p className="mt-2 text-[18px] leading-tight text-[#c0c0c0]">
                {item.role}
              </p>
            </div>
            <p className="text-[20px] leading-[1.05] tracking-[-0.04em] text-[#333]">
              {item.quote}
            </p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function ProcessSection() {
  return (
    <motion.section
      id="process"
      className="bg-white px-8 py-16 md:px-14"
      {...sectionReveal}
    >
      <h2 className="text-center text-[58px] font-normal leading-none tracking-[-0.06em] text-[#2b2b2b] md:text-[76px]">
        What&apos;s The BerryPanel Process?
      </h2>
      <div className="mx-auto mt-16 grid max-w-[1400px] gap-7 md:grid-cols-4">
        {processSteps.map((item) => (
          <motion.article
            key={item.step}
            className="flex min-h-[430px] -rotate-[-1deg] flex-col items-center justify-between rounded-[24px] bg-[#f4f4f4] p-9 text-center even:rotate-[1deg]"
            whileHover={{ rotate: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid h-28 w-full place-items-center rounded-[18px] bg-white text-[#d8cef2]">
              <item.icon className="size-16" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[24px] leading-none tracking-[-0.04em]">
                {item.title}
              </h3>
              <p className="mx-auto mt-7 max-w-[260px] text-[23px] leading-[0.95] tracking-[-0.055em] text-[#444]">
                {item.body}
              </p>
            </div>
            <span className="rounded-full bg-[#d8cef2] px-8 py-3 text-[18px] shadow-[14px_0_0_#fff0b8]">
              {item.step}
            </span>
          </motion.article>
        ))}
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
      <div className="grid items-start gap-8 md:grid-cols-3">
        <div className="flex gap-4">
          <PillButton>Annual</PillButton>
          <PillButton>
            <span className="mr-3 size-9 rounded-full bg-[#d8cef2]" />
            Monthly
          </PillButton>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center gap-4">
            <span className="rounded-full bg-[#f6f6f6] px-6 py-3 text-[18px]">
              Our Prices
            </span>
            <CircleDollarSign className="size-9 text-[#777]" />
          </div>
          <h2 className="mt-9 text-[58px] font-normal leading-none tracking-[-0.06em] text-[#2b2b2b] md:text-[76px]">
            Explore Our Plans
          </h2>
        </div>
        <div className="hidden justify-end gap-5 text-[22px] text-[#444] md:flex">
          See more options
          <span className="grid size-14 place-items-center rounded-full bg-[#d8cef2]">
            &laquo;
          </span>
        </div>
      </div>
      <div className="mt-20 grid gap-7 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>
    </motion.section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const styles = {
    lavender: "bg-[#d8cef2]",
    white: "bg-[#f4f4f4]",
    cream: "bg-[#fff0b8]",
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
        <span className="rounded-full border border-[#777] bg-white/40 px-8 py-3 text-[20px]">
          Monthly
        </span>
        <div>
          <h3 className="text-[52px] leading-none tracking-[-0.06em]">
            {plan.name}
          </h3>
          <p className="mx-auto mt-8 max-w-[360px] text-[23px] leading-[1.05] tracking-[-0.045em] text-[#444]">
            {plan.body}
          </p>
        </div>
        <div className="flex w-full items-center justify-center gap-6">
          <span className="rounded-full bg-white px-9 py-5 text-[38px] leading-none tracking-[-0.06em]">
            {plan.price}
            <span className="ml-4 text-[18px] tracking-[-0.03em] text-[#555]">
              / setup
            </span>
          </span>
          <span className="grid size-20 place-items-center rounded-full bg-white">
            <ArrowUpRight className="size-11" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function FinalCta() {
  const tags = [
    "RESOURCES",
    "DATABASES",
    "PRICING",
    "FEATURES",
    "DOMAINS",
    "SUPPORT",
    "TECHNOLOGIES",
    "LEGAL",
    "TOOLS",
  ];

  return (
    <motion.section
      className="relative min-h-[620px] overflow-hidden bg-[#d8cef2] px-8 py-28 text-center"
      {...sectionReveal}
    >
      <div className="mx-auto flex w-fit gap-4">
        <span className="grid size-12 place-items-center rounded-full bg-white text-[#606060]">
          <ServerCog className="size-6" />
        </span>
        <span className="grid size-12 place-items-center rounded-full bg-white text-[#606060]">
          <Globe2 className="size-6" />
        </span>
      </div>
      <h2 className="relative z-10 mx-auto mt-10 max-w-[900px] text-[56px] font-normal leading-[1.08] tracking-[-0.06em] text-[#111] md:text-[76px]">
        Faster, Fuller Laravel Delivery
        <br />
        For Small Teams
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
              index % 2 === 0 ? "bg-[#fff0b8]" : "bg-white"
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
    <main className="min-h-screen bg-white font-sans text-[#121212]">
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="relative flex flex-col">
        <Header onMenu={() => setMenuOpen(true)} />
        <HeroCard />
        <SplitStatement />
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
