export function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-[#567C8D]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-[#2F4156]">{title}</h2>
    </div>
  );
}
