export function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-[#8a8a8a]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-[#151515]">{title}</h2>
    </div>
  );
}
