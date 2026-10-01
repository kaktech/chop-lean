import { Sk } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <div role="status" aria-label="Loading shop">
      <div className="h-56 bg-green md:h-[290px]" />
      <div className="container-x flex gap-9 py-10"><Sk className="hidden h-[560px] w-[256px] md:block" />
        <div className="grid flex-1 grid-cols-2 gap-4 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Sk key={i} className="h-80" />)}</div></div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
