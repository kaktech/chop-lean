import Image from "next/image";
import Link from "next/link";

type Crumb = { label: string; href?: string };

/** Photographic page banner used by shop, collections and info pages. */
export function PageHero({
  image, eyebrow, title, accent, blurb, crumbs, children, size = "md", position = "center",
}: {
  image: string; eyebrow?: string; title: string; accent?: string; blurb?: string; crumbs?: Crumb[]; children?: React.ReactNode; size?: "sm" | "md" | "lg"; position?: string;
}) {
  const h = size === "lg" ? "min-h-[460px] md:min-h-[560px]" : size === "sm" ? "min-h-[260px] md:min-h-[320px]" : "min-h-[340px] md:min-h-[420px]";
  return (
    <section className={`relative isolate flex items-end overflow-hidden ${h}`}>
      <Image src={image.startsWith("http") ? image : `/images/${image}`} alt="" fill priority sizes="100vw" className="-z-20 object-cover" style={{ objectPosition: position }} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/30" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas/80 via-canvas/30 to-transparent" />
      <div className="container-x w-full pb-9 pt-24 md:pb-14">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-5 text-xs text-muted md:text-[13px]">
            {crumbs.map((c, i) => (
              <span key={c.label}>{i > 0 && " / "}{c.href ? <Link href={c.href} className="text-fg underline-offset-4 hover:underline">{c.label}</Link> : c.label}</span>
            ))}
          </nav>
        )}
        {eyebrow && <div className="eyebrow cl-up cl-d1">{eyebrow}</div>}
        <h1 className="display-xl cl-up cl-d2 mt-3 max-w-[880px] text-[40px] md:text-[68px]">
          {title}{accent && <> <span className="serif-accent">{accent}</span></>}
        </h1>
        {blurb && <p className="cl-up cl-d3 mt-4 max-w-[600px] text-base leading-relaxed text-body md:text-lg">{blurb}</p>}
        {children && <div className="cl-up cl-d4 mt-6">{children}</div>}
      </div>
    </section>
  );
}
