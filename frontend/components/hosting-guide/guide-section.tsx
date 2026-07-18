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
          <p className="text-sm font-medium uppercase tracking-normal text-[#567C8D]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-semibold tracking-normal text-[#2F4156] sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="text-base leading-7 text-[#567C8D] sm:text-lg">
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
        "rounded-[24px] border border-[#C8D9E6] bg-white p-5 shadow-sm sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CommandBlock({ command }: { command: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-[#2F4156] px-4 py-3 text-sm leading-6 text-white">
      <code>{command}</code>
    </pre>
  );
}

export function DotList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-[#567C8D] sm:text-base">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F4156]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
