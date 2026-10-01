"use client";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resetWeeklySlots, saveProduct, setInventoryLock, toggleLive } from "@/app/actions/admin";
import { formatNaira } from "@/lib/money";
import { imgSrc } from "@/lib/img";

export type AdminProduct = { id: string; slug: string; type: "plan" | "meal" | "drink"; name: string; description: string | null; image: string | null; kcal: number | null; priceKobo: number; compareAtKobo: number | null; weeklySlots: number | null; slotsTaken: number; isLive: boolean; tags: string[]; slot: string | null };

const input = "min-h-11 w-full rounded-xl border border-input-line bg-white px-3.5 text-[15px]";

export function ProductsClient({ products, tab, counts, locked, selectedId, creating }: { products: AdminProduct[]; tab: string; counts: Record<string, number>; locked: boolean; selectedId: string | null; creating: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [soldOutOnly, setSoldOutOnly] = useState(false);
  const [pending, start] = useTransition();
  const selected = products.find((p) => p.id === selectedId) ?? null;
  const type = tab === "plans" ? "plan" : tab === "meals" ? "meal" : "drink";

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) && (!soldOutOnly || (p.weeklySlots != null && p.slotsTaken >= p.weeklySlots)));
  const act = (fn: () => Promise<{ ok: boolean; message: string }>) => start(async () => { const r = await fn(); r.ok ? toast.success(r.message) : toast.error(r.message); router.refresh(); });

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="min-w-0 rounded-[24px] border border-line bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {([["plans", "Plans"], ["meals", "Meals"], ["drinks", "Snacks and drinks"]] as const).map(([k, l]) => (
            <Link key={k} href={`/admin/products?tab=${k}`} className={`tap flex items-center rounded-full border px-4 text-[13px] font-medium no-underline ${tab === k ? "border-green bg-green font-bold text-white" : "border-line text-ink"}`}>{l} ({counts[k] ?? 0})</Link>
          ))}
          <label className="ml-auto flex items-center gap-2.5 text-[13px] font-bold">
            Lock inventory
            <button type="button" role="switch" aria-checked={locked} disabled={pending} onClick={() => act(() => setInventoryLock(!locked))} className={`relative h-6 w-11 rounded-full transition-colors ${locked ? "bg-green" : "bg-input-line"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${locked ? "left-[22px]" : "left-0.5"}`} /></button>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">When locked, a plan sells out automatically once its weekly kitchen slots are full.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="pq">Search products</label>
          <input id="pq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="min-h-11 min-w-0 flex-1 rounded-xl bg-[#F2F1EC] px-4 text-sm" />
          <button type="button" onClick={() => setSoldOutOnly(false)} className={`tap rounded-xl border px-4 text-[13px] font-bold ${!soldOutOnly ? "border-line bg-[#F2F1EC]" : "border-line bg-white"}`}>All</button>
          <button type="button" onClick={() => setSoldOutOnly(true)} className={`tap rounded-xl border px-4 text-[13px] ${soldOutOnly ? "border-line bg-[#F2F1EC] font-bold" : "border-line bg-white"}`}>Sold out this week</button>
          {tab === "plans" && <button type="button" disabled={pending} onClick={() => act(resetWeeklySlots)} className="tap rounded-xl border border-line px-4 text-[13px] text-muted">Reset weekly counts</button>}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="label-sm border-b border-line text-[11px] text-muted"><th className="py-3">Product</th><th>Calories</th><th>Price{tab === "plans" ? " / week" : ""}</th><th>Weekly slots</th><th>Live</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={`border-b border-line last:border-0 ${p.id === selectedId ? "bg-green-tint" : ""}`}>
                  <td className="py-3">
                    <Link href={`/admin/products?tab=${tab}&id=${p.id}`} className="flex items-center gap-3 text-ink no-underline">
                      <Image src={imgSrc(p.image)} alt="" width={44} height={44} className="size-11 rounded-lg object-cover" />
                      <span><b className="block font-display">{p.name}</b><span className="text-xs text-muted uppercase">{p.type}-{p.slug.slice(0, 12)}</span></span>
                    </Link>
                  </td>
                  <td>{p.kcal ?? "–"}</td>
                  <td className="font-display font-bold">{formatNaira(p.priceKobo)}</td>
                  <td className={p.weeklySlots != null && p.slotsTaken >= p.weeklySlots ? "font-bold text-price-red" : "text-muted"}>{p.weeklySlots != null ? `${p.slotsTaken} / ${p.weeklySlots}` : "Unlimited"}</td>
                  <td><button type="button" role="switch" aria-checked={p.isLive} aria-label={`${p.name} live`} disabled={pending} onClick={() => act(() => toggleLive(p.id, !p.isLive))} className={`relative h-6 w-11 rounded-full ${p.isLive ? "bg-green" : "bg-input-line"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${p.isLive ? "left-[22px]" : "left-0.5"}`} /></button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">Nothing here.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <aside>
        {selected || creating ? <ProductForm key={selected?.id ?? "new"} product={selected} type={type} tab={tab} /> : (
          <div className="rounded-[24px] border border-dashed border-input-line p-6 text-center text-sm text-muted"><p>Select a product to edit it, or</p>
            <Link href={`/admin/products?tab=${tab}&new=1`} className="cl-btn tap mt-3 inline-flex items-center rounded-xl bg-green px-5 font-bold text-white no-underline">+ Add product</Link></div>
        )}
      </aside>
    </div>
  );
}

function ProductForm({ product, type, tab }: { product: AdminProduct | null; type: string; tab: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (prev: { ok: boolean; message: string } | null, fd: FormData) => {
    const r = await saveProduct(prev, fd);
    r.ok ? toast.success(r.message) : toast.error(r.message);
    if (r.ok) router.replace(`/admin/products?tab=${tab}`);
    router.refresh();
    return r;
  }, null);
  const lab = "mb-1.5 block text-[13px] font-bold";
  return (
    <form action={action} className="rounded-[24px] border border-line bg-white p-5 md:p-6">
      <h2 className="text-xl">{product ? `Edit: ${product.name}` : "New product"}</h2>
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="type" value={product?.type ?? type} />
      <div className="mt-4 flex gap-2">
        {product?.image && <Image src={imgSrc(product.image)} alt="" width={96} height={96} className="size-24 rounded-xl object-cover" />}
        <label className="flex size-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-input-line text-center text-xs text-muted">+ Add photo<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="sr-only" /></label>
      </div>
      <div className="mt-4 flex flex-col gap-3.5">
        <div><label htmlFor="pf-name" className={lab}>Name</label><input id="pf-name" name="name" defaultValue={product?.name} required className={input} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="pf-price" className={lab}>Price{(product?.type ?? type) === "plan" ? " / week" : ""} (₦)</label><input id="pf-price" name="priceNaira" type="number" min="0" step="50" defaultValue={product ? product.priceKobo / 100 : ""} required className={input} /></div>
          <div><label htmlFor="pf-cmp" className={lab}>Compare-at (₦)</label><input id="pf-cmp" name="compareAtNaira" type="number" min="0" step="50" defaultValue={product?.compareAtKobo ? product.compareAtKobo / 100 : ""} className={input} /></div>
          <div><label htmlFor="pf-kcal" className={lab}>kcal{(product?.type ?? type) === "plan" ? " / day" : ""}</label><input id="pf-kcal" name="kcal" type="number" min="0" defaultValue={product?.kcal ?? ""} className={input} /></div>
          <div><label htmlFor="pf-slots" className={lab}>Weekly slots</label><input id="pf-slots" name="weeklySlots" type="number" min="0" placeholder="Unlimited" defaultValue={product?.weeklySlots ?? ""} className={input} /></div>
        </div>
        {(product?.type ?? type) === "meal" && <div><label htmlFor="pf-slot" className={lab}>Meal type</label><select id="pf-slot" name="slot" defaultValue={product?.slot ?? "lunch"} className={input}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option></select></div>}
        <div><label htmlFor="pf-tags" className={lab}>Tags</label><input id="pf-tags" name="tags" defaultValue={product?.tags.join(", ")} placeholder="low-carb, high-protein" className={input} /></div>
        <div><label htmlFor="pf-desc" className={lab}>Description</label><textarea id="pf-desc" name="description" rows={2} defaultValue={product?.description ?? ""} className={`${input} py-2.5`} /></div>
      </div>
      {state && !state.ok && <p role="alert" className="mt-3 text-sm text-price-red">{state.message}</p>}
      <button disabled={pending} className="cl-btn mt-4 min-h-12 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60">{pending ? "Saving…" : product ? "Save changes" : "Create product"}</button>
    </form>
  );
}
