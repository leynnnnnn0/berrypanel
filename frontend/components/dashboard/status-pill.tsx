export function StatusPill({ children }: { children: string }) {
  const normalized = children.toLowerCase();
  const tone =
    normalized === "online" || normalized === "provisioned"
      ? "bg-[#dff8c8] text-[#2c4a1f]"
      : normalized === "deploying" || normalized === "needs configuration"
        ? "bg-[#F1F1F1] text-[#2F4156]"
        : "bg-[#F1F1F1] text-[#567C8D]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}
