import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function DashboardHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  contextLabel = "Workspace",
  contextValue,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  contextLabel?: string;
  contextValue: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="relative isolate min-h-[260px] overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#2F4156_0%,#567C8D_100%)] px-6 py-8 text-white shadow-[0_24px_60px_rgba(47,65,86,0.16)] sm:px-8 lg:px-10 lg:py-9">
      <div className="absolute -right-24 -top-32 size-[360px] rounded-full border border-white/8" />
      <div className="absolute -bottom-48 right-36 size-[320px] rounded-full border border-white/8" />

      <div className="relative z-10 grid h-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.38fr)]">
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C8D9E6]">
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.035em] sm:text-5xl 2xl:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/62 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 lg:items-end">
          <div className="min-h-11">{action}</div>
          <div className="flex w-full max-w-[330px] items-center gap-4 rounded-3xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#C8D9E6] text-[#2F4156] shadow-sm">
              <Icon className="size-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {contextLabel}
              </span>
              <span className="mt-1 block truncate text-sm font-semibold text-white sm:text-base">
                {contextValue}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
