"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { logWeight, pauseNextWeek, reorderLines, resumeNextWeek } from "@/app/actions/account";
import { saveQuizProfile } from "@/app/actions/profile";
import type { QuizData } from "@/lib/quiz-schema";
import { useCart, useUI, type CartLine } from "@/lib/store";
import { QUIZ_KEY } from "@/components/quiz/QuizClient";

/** Pushes a quiz result stored while signed out into the profile after sign-in. */
export function SyncQuiz() {
  const router = useRouter();
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as QuizData;
      saveQuizProfile(data).then((r) => { if (r.saved) router.refresh(); });
    } catch { /* ignore */ }
  }, [router]);
  return null;
}

export function WeightForm({ latest }: { latest: number | null }) {
  const [state, action, pending] = useActionState(logWeight, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label htmlFor="kg" className="sr-only">Weight in kilograms</label>
        <input id="kg" name="kg" type="number" step="0.1" min="30" max="300" inputMode="decimal" defaultValue={latest ?? ""} placeholder="e.g. 83.6" className="min-h-14 min-w-0 flex-1 rounded-2xl border border-input-line bg-white px-4 font-display text-2xl font-bold" />
        <span className="text-muted">kg</span>
        <button disabled={pending} className="cl-btn min-h-14 rounded-2xl bg-ink px-6 font-bold text-white disabled:opacity-60">{pending ? "…" : "Save"}</button>
      </div>
      <p role="status" className={`text-sm ${state && !state.ok ? "text-price-red" : "text-green"}`}>{state?.message}</p>
    </form>
  );
}

export function PauseButton({ paused, locked }: { paused: boolean; locked: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = () => start(async () => {
    const r = paused ? await resumeNextWeek() : await pauseNextWeek();
    if (r.ok) toast.success(r.message); else toast.error(r.message);
    router.refresh();
  });
  return (
    <button type="button" onClick={run} disabled={pending || locked} title={locked ? "The Thursday 6pm cutoff has passed" : undefined}
      className="cl-btn tap rounded-full border border-white/70 px-5 text-[13px] font-bold text-white disabled:opacity-50">
      {paused ? "Resume next week" : "Pause next week"}
    </button>
  );
}

export function ReorderButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const add = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => {
      const lines = await reorderLines(orderId);
      if (!lines.length) { toast.error("Those items aren't available any more."); return; }
      for (const l of lines) add(l as Omit<CartLine, "id" | "qty"> & { qty: number });
      setCartOpen(true);
    })} className="min-h-11 font-bold text-green underline disabled:opacity-60">{pending ? "…" : "Reorder"}</button>
  );
}

export type WeightPoint = { label: string; kg: number; pace: number };

export function WeightChart({ data, goal }: { data: WeightPoint[]; goal: number | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (data.length === 0) {
    return <div className="rounded-2xl border border-dashed border-input-line px-6 py-12 text-center"><p className="font-serif text-2xl">No weigh-ins yet.</p><p className="mt-1 text-sm text-muted">Log your first weight above and your chart appears here.</p></div>;
  }
  const all = data.flatMap((d) => [d.kg, d.pace]).concat(goal ? [goal] : []);
  const min = Math.floor(Math.min(...all)) - 1, max = Math.ceil(Math.max(...all)) + 1;
  return (
    <div className="h-[280px] w-full" role="img" aria-label={`Weight chart: ${data.map((d) => `${d.label} ${d.kg} kg`).join(", ")}`}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#EDEBE3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5B6560" }} />
            <YAxis domain={[min, max]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5B6560" }} width={44} />
            <Tooltip formatter={(v) => [`${v} kg`, ""]} contentStyle={{ borderRadius: 12, border: "1px solid #E6E4DC" }} />
            <Line type="linear" dataKey="pace" stroke="#9AA096" strokeDasharray="5 5" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            <Line type="linear" dataKey="kg" stroke="#3D6B1F" strokeWidth={2.5} dot={{ r: 4, fill: "#3D6B1F", stroke: "#3D6B1F" }} isAnimationActive={false} />
            <ReferenceDot x={data[data.length - 1].label} y={data[data.length - 1].kg} r={7} fill="#F6B81A" stroke="#15201A" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
