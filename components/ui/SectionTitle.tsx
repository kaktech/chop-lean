export function SectionTitle({
  watermark, children, sub, align = "center", eyebrow,
}: {
  watermark?: string; children: React.ReactNode; sub?: string; align?: "center" | "left"; eyebrow?: string;
}) {
  return (
    <div className={`relative mb-8 md:mb-12 ${align === "center" ? "text-center" : ""}`}>
      {watermark && <div aria-hidden className={`watermark absolute -top-8 text-[84px] md:-top-[74px] md:text-[170px] ${align === "center" ? "inset-x-0" : "left-0"}`}>{watermark}</div>}
      {eyebrow && <div className={`eyebrow both relative ${align === "center" ? "justify-center" : ""}`}>{eyebrow}</div>}
      <h2 className="display-xl relative mt-3 text-[32px] md:text-[52px]">{children}</h2>
      {sub && <p className={`relative mt-3 text-sm text-muted md:text-base ${align === "center" ? "mx-auto max-w-[620px]" : "max-w-[620px]"}`}>{sub}</p>}
    </div>
  );
}
