import { ChartNoAxesCombined, type LucideIcon } from "lucide-react";

export type MetricCardTone =
  | "lavender"
  | "sky"
  | "mist"
  | "slate"
  | "cream";

const tones: Record<
  MetricCardTone,
  { card: string; badge: string; detail: string }
> = {
  lavender: {
    card: "bg-[#C8D9E6]",
    badge: "bg-[#2F4156] text-white",
    detail: "text-[#567C8D]",
  },
  sky: {
    card: "bg-[#C8D9E6]/75",
    badge: "bg-[#567C8D] text-white",
    detail: "text-[#567C8D]",
  },
  mist: {
    card: "bg-white",
    badge: "bg-[#567C8D] text-white",
    detail: "text-[#567C8D]",
  },
  slate: {
    card: "bg-[#567C8D]/20",
    badge: "bg-[#2F4156] text-white",
    detail: "text-[#567C8D]",
  },
  cream: {
    card: "bg-[#F1F1F1]",
    badge: "bg-[#567C8D] text-white",
    detail: "text-[#567C8D]",
  },
};

export function MetricCard({
  label,
  value,
  detail,
  eyebrow = "Live workspace",
  icon: Icon = ChartNoAxesCombined,
  tone = "lavender",
}: {
  label: string;
  value: string;
  detail: string;
  eyebrow?: string;
  icon?: LucideIcon;
  tone?: MetricCardTone;
}) {
  const colors = tones[tone];

  return (
    <article
      className={`relative min-h-[190px] overflow-hidden rounded-[1.75rem] p-6 shadow-[0_18px_40px_rgba(47,65,86,0.08)] ${colors.card}`}
    >
      <Icon className="pointer-events-none absolute -bottom-5 -right-4 size-28 text-[#567C8D]/10" strokeWidth={1.5} />
      <div className="relative z-10 flex h-full min-h-[142px] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#567C8D]">
              {eyebrow}
            </p>
            <p className="mt-3 text-base font-semibold text-[#2F4156]">
              {label}
            </p>
          </div>
          <span
            className={`grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm ${colors.badge}`}
          >
            <Icon className="size-5" strokeWidth={1.8} />
          </span>
        </div>

        <div>
          <span className="block break-words text-4xl font-semibold tracking-[-0.04em] text-[#2F4156]">
          {value}
          </span>
          <span className={`mt-2 block text-sm ${colors.detail}`}>
          {detail}
          </span>
        </div>
      </div>
    </article>
  );
}
