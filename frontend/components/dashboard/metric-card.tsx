export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-sm text-[#777]">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <span className="break-words text-3xl font-semibold text-[#151515]">
          {value}
        </span>
        <span className="shrink-0 rounded-full bg-[#f4f4f4] px-3 py-1 text-xs text-[#555]">
          {detail}
        </span>
      </div>
    </div>
  );
}
