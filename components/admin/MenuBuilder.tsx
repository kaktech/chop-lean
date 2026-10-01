"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWeeklyMenu } from "@/app/actions/admin";

type Meal = { id: string; name: string; kcal: number | null; slot: string | null };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const SLOTS = ["breakfast", "lunch", "dinner"] as const;

export function MenuBuilder({ weeks, meals, initial }: { weeks: string[]; meals: Meal[]; initial: Record<string, Record<string, string>> }) {
  const [week, setWeek] = useState(weeks[0]);
  const [sel, setSel] = useState<Record<string, Record<string, string>>>(initial);
  const [pending, start] = useTransition();
  const cur = sel[week] ?? {};
  const set = (day: string, slot: string, id: string) => setSel((s) => ({ ...s, [week]: { ...(s[week] ?? {}), [`${day}-${slot}`]: id } }));
  const total = (day: string) => SLOTS.reduce((n, slot) => n + (meals.find((m) => m.id === cur[`${day}-${slot}`])?.kcal ?? 0), 0);

  const save = () => start(async () => {
    const items = DAYS.flatMap((day) => SLOTS.flatMap((slot) => (cur[`${day}-${slot}`] ? [{ day, slot, mealId: cur[`${day}-${slot}`] }] : [])));
    const r = await saveWeeklyMenu({ weekOf: week, items });
    r.ok ? toast.success(r.message) : toast.error(r.message);
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold">Week of
          <select value={week} onChange={(e) => setWeek(e.target.value)} className="min-h-11 rounded-xl border border-input-line bg-white px-3 font-normal">{weeks.map((w) => <option key={w} value={w}>{w}</option>)}</select></label>
        <button onClick={save} disabled={pending} className="cl-btn tap rounded-xl bg-ink px-6 font-bold text-white disabled:opacity-60">{pending ? "Saving…" : "Save menu"}</button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {DAYS.map((day) => (
          <div key={day} className="rounded-[20px] border border-line bg-white p-3.5">
            <div className="mb-2 flex items-baseline justify-between"><b className="font-display">{day}</b><span className="text-xs text-muted">{total(day)} kcal</span></div>
            {SLOTS.map((slot) => (
              <div key={slot} className="mb-2.5">
                <label htmlFor={`${day}-${slot}`} className="label-sm text-[10px] text-green">{slot}</label>
                <select id={`${day}-${slot}`} value={cur[`${day}-${slot}`] ?? ""} onChange={(e) => set(day, slot, e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-input-line bg-white px-2 text-[13px]">
                  <option value="">Choose a dish…</option>
                  {meals.filter((m) => m.slot === slot).map((m) => <option key={m.id} value={m.id}>{m.name} ({m.kcal})</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
