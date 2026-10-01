export function SectionTitle({
  watermark,
  children,
  sub,
  align = "center",
}: {
  watermark: string;
  children: React.ReactNode;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`relative mb-8 md:mb-11 ${align === "center" ? "text-center" : ""}`}>
      <div aria-hidden className={`watermark absolute -top-8 text-[84px] md:-top-[70px] md:text-[170px] ${align === "center" ? "inset-x-0" : "left-0"}`}>{watermark}</div>
      <h2 className="relative text-[30px] tracking-[-0.03em] md:text-5xl">{children}</h2>
      {sub && <p className="relative mt-2.5 text-sm text-muted md:text-base">{sub}</p>}
    </div>
  );
}
