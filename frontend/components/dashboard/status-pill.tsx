export function StatusPill({ children }: { children: string }) {
  const normalized = children.toLowerCase();
  const tone =
    normalized === "online" || normalized === "provisioned"
      ? "bg-[#dff8c8] text-[#2c4a1f]"
      : normalized === "deploying" || normalized === "needs configuration"
        ? "bg-[#fff0b8] text-[#5c4b10]"
        : "bg-[#f4f4f4] text-[#555]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}
