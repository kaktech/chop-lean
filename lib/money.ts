const ngn = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const ngnFull = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** kobo -> "₦52,500" */
export function formatNaira(kobo: number): string {
  return `₦${ngn.format(Math.round(kobo / 100))}`;
}

/** kobo -> "NGN 52,500.00" (plan page and checkout totals) */
export function formatNairaFull(kobo: number): string {
  return `NGN ${ngnFull.format(kobo / 100)}`;
}

export const nairaToKobo = (naira: number) => Math.round(naira * 100);
