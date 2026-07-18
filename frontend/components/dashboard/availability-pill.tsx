import type { SiteAvailability } from "@/types/dashboard";

export function availabilityLabel(availability?: SiteAvailability | null) {
  switch (availability?.status) {
    case "online":
      return "Online";
    case "redirected":
      return "Redirected";
    case "offline":
      return "Offline";
    default:
      return "Not checked";
  }
}

export function availabilityDetail(availability?: SiteAvailability | null) {
  if (!availability?.checked_at) {
    return "waiting for first check";
  }

  const parts = [
    availability.http_status ? `HTTP ${availability.http_status}` : null,
    typeof availability.response_ms === "number" ? `${availability.response_ms} ms` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "no response";
}

export function AvailabilityPill({
  availability,
}: {
  availability?: SiteAvailability | null;
}) {
  const status = availability?.status ?? "unknown";
  const tone =
    status === "online"
      ? "bg-[#dff8c8] text-[#2c4a1f]"
      : status === "redirected"
        ? "bg-amber-100 text-amber-800"
        : status === "offline"
          ? "bg-red-50 text-red-700"
          : "bg-[#F1F1F1] text-[#567C8D]";
  const checkedAt = availability?.checked_at
    ? new Date(availability.checked_at).toLocaleString()
    : "Not checked yet";
  const title = `${availabilityLabel(availability)} · ${availabilityDetail(availability)} · ${checkedAt}${availability?.error ? ` · ${availability.error}` : ""}`;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${tone}`}
      title={title}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {availabilityLabel(availability)}
    </span>
  );
}
