import { Sk } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container-x py-10" role="status" aria-label="Loading">
      <Sk className="h-12 w-72" />
      <Sk className="mt-4 h-5 w-96 max-w-full" />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <Sk key={i} className="h-72" />)}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
