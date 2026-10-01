const INFO = [
  ["Ingredients and allergens", "Every meal is labelled with ingredients. Common allergens: fish, crayfish, shellfish, egg, groundnut, wheat. Tell us what to leave out at checkout."],
  ["Storage and heating", "Keep refrigerated and eat within 3 days. Microwave for 3 minutes with the lid loosened, or heat in a pot."],
  ["Pause, skip or cancel", "Change or pause any week from your account before Thursday 6pm. No fees, no long contracts."],
];

export function ProductInfo() {
  return (
    <section className="container-x py-10 md:py-14">
      <div className="grid gap-3 md:grid-cols-3 md:gap-5">
        {INFO.map(([t, d]) => (
          <details key={t} className="group rounded-2xl border border-line bg-surface px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 font-display font-bold">
              <span aria-hidden className="text-xs transition-transform group-open:rotate-90">▶</span>{t}
            </summary>
            <p className="pb-1 pt-2 text-sm leading-relaxed text-muted">{d}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
