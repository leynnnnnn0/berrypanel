"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Database, Globe2, ServerCog } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function AuthLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 text-[22px] font-semibold tracking-[-0.01em] text-[#2F4156]"
    >
      <span className="relative size-8 overflow-hidden rounded-[4px] bg-[#2F4156]">
        <span className="absolute bottom-0 left-1/2 h-8 w-3 -translate-x-1/2 rotate-45 bg-white" />
        <span className="absolute right-1 top-1 h-5 w-3 -rotate-45 bg-white" />
      </span>
      <span>BerryPanel</span>
    </Link>
  );
}

function AuthVisual({ mode }: { mode: "login" | "register" }) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#C8D9E6] p-10 lg:block">
      <div className="absolute left-10 top-10 flex gap-4">
        <span className="grid size-12 place-items-center rounded-full bg-white text-[#567C8D]">
          <ServerCog className="size-6" />
        </span>
        <span className="grid size-12 place-items-center rounded-full bg-white text-[#567C8D]">
          <Globe2 className="size-6" />
        </span>
      </div>
      <div className="absolute right-10 top-10 flex items-center gap-3 text-[18px] text-[#567C8D]">
        <span className="grid size-11 place-items-center rounded-full border border-[#567C8D] text-[#2F4156]">
          EN
        </span>
        <span>PH</span>
      </div>

      <motion.div
        className="absolute bottom-0 left-[14%] h-[36%] w-[68%] rounded-t-[18px] bg-gradient-to-b from-[#2F4156] to-[#2F4156]"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute bottom-[24%] right-[-5%] h-[330px] w-[62%] rotate-[-7deg] rounded-[24px] border-[10px] border-[#2F4156] bg-white shadow-2xl"
        initial={{ x: 80, rotate: -13, opacity: 0 }}
        animate={{ x: 0, rotate: -7, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="h-full overflow-hidden rounded-[14px] bg-[#F1F1F1]">
          <div className="h-[42%] bg-[linear-gradient(135deg,#2F4156,#567C8D)] opacity-75" />
          <div className="space-y-4 p-6">
            <span className="rounded-full bg-[#2F4156] px-3 py-1 text-xs text-white">
              {mode === "login" ? "Control Panel" : "Customer Access"}
            </span>
            <div className="text-[38px] leading-[0.95] tracking-[-0.06em]">
              {mode === "login" ? (
                <>
                  Manage
                  <br />
                  Hosting
                </>
              ) : (
                <>
                  Launch
                  <br />
                  Laravel
                </>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-14 rounded-xl bg-[#C8D9E6]" />
              <div className="h-14 rounded-xl bg-white" />
              <div className="h-14 rounded-xl bg-[#F1F1F1]" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-10 right-10 flex items-center gap-4 rounded-full bg-white/95 p-3 shadow-xl">
        {["PHP", "DB", "SSL"].map((item, index) => (
          <span
            key={item}
            className={`grid size-16 place-items-center rounded-full text-[15px] font-medium ${
              index === 0
                ? "border-[5px] border-[#2F4156] bg-[#C8D9E6]"
                : "bg-[#C8D9E6]"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
      <div className="absolute bottom-10 left-10 max-w-[360px] text-white">
        <Database className="mb-5 size-10" />
        <p className="text-[28px] leading-[1.02] tracking-[-0.055em] text-white/90">
          Provision users, Laravel sites, and databases from one small-server
          panel.
        </p>
      </div>
    </aside>
  );
}

export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
  mode,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  mode: "login" | "register";
}) {
  return (
    <main className="min-h-screen bg-white text-[#2F4156]">
      <div className="grid min-h-screen lg:grid-cols-[0.52fr_0.48fr]">
        <section className="relative flex min-h-screen flex-col px-7 py-7 md:px-12">
          <header className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#567C8D] px-5 text-[18px]"
            >
              <ArrowLeft className="size-5" />
              Home
            </Link>
            <AuthLogo />
          </header>

          <motion.div
            className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center py-16"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-10 flex items-center gap-3">
              <span className="rounded-full bg-[#F1F1F1] px-6 py-3 text-[18px] text-[#567C8D]">
                {eyebrow}
              </span>
              <span className="grid size-12 place-items-center rounded-full bg-[#C8D9E6]">
                B
              </span>
            </div>
            <h1 className="text-[56px] font-normal leading-[0.94] tracking-[-0.065em] md:text-[76px]">
              {title}
            </h1>
            <p className="mt-6 max-w-[440px] text-[22px] leading-[1.08] tracking-[-0.04em] text-[#567C8D]">
              {subtitle}
            </p>
            <div className="mt-10">{children}</div>
          </motion.div>
        </section>
        <AuthVisual mode={mode} />
      </div>
    </main>
  );
}
