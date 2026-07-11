import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GuideSection({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="max-w-3xl space-y-2">
        {eyebrow && (
          <p className="text-sm font-medium uppercase tracking-normal text-neutral-500">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-semibold tracking-normal text-neutral-950 sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="text-base leading-7 text-neutral-600 sm:text-lg">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function InfoCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CommandBlock({ command }: { command: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-neutral-950 px-4 py-3 text-sm leading-6 text-white">
      <code>{command}</code>
    </pre>
  );
}

export function DotList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-neutral-600 sm:text-base">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
