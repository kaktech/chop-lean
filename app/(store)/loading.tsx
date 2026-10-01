/** Neutral route-change indicator: a thin progress bar, so pages don't flash a skeleton that belongs to a different page. */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="min-h-[60vh]">
      <div className="h-0.5 w-full overflow-hidden bg-transparent"><div className="h-full w-1/3 animate-[clBar_1s_ease-in-out_infinite] rounded-full bg-yellow" /></div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
