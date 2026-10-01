"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { saveQuizProfile, type QuizData } from "@/app/actions/profile";
import { dailyKcalTarget, type Activity } from "@/lib/pricing";

export const QUIZ_KEY = "chop-lean-quiz";
type PlanLite = { slug: string; name: string; kcal: number; tags: string[] };

const GOALS = [
  { id: "lose", t: "Lose weight", d: "A gentle, steady deficit" },
  { id: "keep", t: "Maintain", d: "Eat well, stay steady" },
  { id: "gain", t: "Build muscle", d: "More protein, more energy" },
] as const;
const ACTIVITIES: { v: "light" | "moderate" | "active"; l: string }[] = [
  { v: "light", l: "Desk job, some walking" },
  { v: "moderate", l: "On my feet all day" },
  { v: "active", l: "Train 3+ times a week" },
];
const PREFS = ["No pork", "No beef", "No shellfish", "Pescatarian", "No swallow", "No groundnut", "Low salt", "No egg"];
const PEPPER = ["Mild", "Medium-mild", "Medium", "Hot", "Naija hot"];

const lab = "flex flex-col gap-1.5 text-[13px] font-bold";
const field = "min-h-12 rounded-[14px] border border-input-line bg-white px-3.5 text-[15px] font-normal";

export function QuizClient({ plans, signedIn }: { plans: PlanLite[]; signedIn: boolean }) {
  const [goal, setGoal] = useState<"lose" | "keep" | "gain">("lose");
  const [sex, setSex] = useState<"female" | "male">("female");
  const [age, setAge] = useState(29);
  const [height, setHeight] = useState(165);
  const [weight, setWeight] = useState(86);
  const [goalWeight, setGoalWeight] = useState(72);
  const [activity, setActivity] = useState<"light" | "moderate" | "active">("light");
  const [prefs, setPrefs] = useState<string[]>(["No pork", "No beef"]);
  const [pepper, setPepper] = useState(4);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_KEY);
      if (!raw) return;
      const q = JSON.parse(raw) as QuizData;
      setGoal(q.goal); setSex(q.sex); setAge(q.age); setHeight(q.heightCm); setWeight(q.weightKg); setGoalWeight(q.goalWeightKg ?? q.weightKg);
      setActivity(q.activity); setPrefs(q.exclusions); setPepper(q.pepper);
    } catch { /* ignore corrupt storage */ }
  }, []);

  const valid = age >= 18 && height >= 120 && weight >= 35;
  const calc = useMemo(
    () => (valid ? dailyKcalTarget({ sex, weightKg: weight, heightCm: height, age, activity: activity as Activity, goal }) : null),
    [valid, sex, weight, height, age, activity, goal],
  );
  const protein = Math.round((weight * (goal === "gain" ? 1.6 : 1.3)) / 5) * 5;
  const pace = goal === "lose" ? "≈ 0.5 kg" : goal === "gain" ? "≈ 0.25 kg" : "steady";
  const paceLabel = goal === "lose" ? "per week" : goal === "gain" ? "gain / week" : "weight";

  const match = useMemo(() => {
    if (!calc) return null;
    const avoidSwallow = prefs.includes("No swallow");
    const sameKcal = plans.filter((p) => p.kcal === calc.plan && !(avoidSwallow && p.tags.includes("swallow")));
    return sameKcal.find((p) => p.slug.startsWith("naija-lean")) ?? sameKcal[0] ?? plans.reduce((b, p) => (Math.abs(p.kcal - calc.plan) < Math.abs(b.kcal - calc.plan) ? p : b), plans[0]);
  }, [calc, plans, prefs]);

  const submit = () => {
    if (!calc) { setMsg("Check your age, height and weight. You must be 18 or over."); return; }
    const data: QuizData = { goal, sex, age, heightCm: height, weightKg: weight, goalWeightKg: goalWeight, activity, exclusions: prefs, pepper, dailyKcal: calc.target };
    setMsg(null);
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify(data)); } catch { /* private mode */ }
    start(async () => {
      const r = await saveQuizProfile(data);
      if (!r.ok) setMsg(r.message ?? "Couldn't save that.");
      else { setDone(true); setTimeout(() => document.getElementById("quiz-result")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }
    });
  };

  const toggle = (p: string) => setPrefs((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  return (
    <section className="container-x grid gap-6 pb-20 pt-8 md:pt-14 lg:grid-cols-12 lg:gap-8">
      <aside className="cl-up cl-d1 relative flex flex-col gap-5 overflow-hidden rounded-[30px] bg-green p-7 text-white md:p-11 lg:col-span-5 lg:min-h-[1080px]">
        <div aria-hidden className="absolute -bottom-10 -right-8 font-serif text-[260px] leading-none text-white/[0.07]">You</div>
        <span className="label-sm tracking-[0.16em] text-yellow">Find my plan</span>
        <h1 className="relative text-[38px] leading-[1.02] tracking-[-0.03em] md:text-[54px]">A plan built around <span className="font-serif font-normal italic text-yellow">your</span> body, not a template.</h1>
        <p className="relative leading-[1.7] text-mint">We use the Mifflin-St Jeor formula to estimate how much energy you burn in a day, subtract a safe deficit, and round to the nearest Chop Lean plan.</p>
        <div className="relative mt-2 flex gap-2" aria-hidden>{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= 2 || done ? "bg-yellow" : "bg-white/25"}`} />)}</div>

        <div id="quiz-result" className="relative mt-auto flex flex-col gap-3.5 rounded-3xl bg-white p-7 text-ink">
          <span className="label-sm text-[13px] text-muted">{done ? "Your daily target" : "Your estimate so far"}</span>
          <span className="flex items-baseline gap-2.5">
            <span className="font-display text-[58px] font-extrabold leading-none tracking-tight text-green" aria-live="polite">{calc ? (Math.round(calc.target / 10) * 10).toLocaleString("en-NG") : "–"}</span>
            <span className="text-muted">kcal / day</span>
          </span>
          <div className="grid grid-cols-3 gap-2.5 text-[13px]">
            {[[pace, paceLabel], [`${protein} g`, "protein"], ["3 meals", "+ 1 snack"]].map(([v, l]) => <span key={l} className="rounded-2xl bg-[#F4F1E8] p-3"><b className="block text-[17px]">{v}</b>{l}</span>)}
          </div>
          {calc && calc.target === 1200 && goal === "lose" && <p className="text-xs text-muted">We never go below 1,200 kcal a day without a doctor&apos;s advice.</p>}
          {match && (
            <div className="flex items-center gap-3 border-t border-line pt-3.5">
              <span className="flex-1 text-sm">Best match: <b>{match.name}</b> + zobo snack</span>
              <Link href={`/plans/${match.slug}`} className="cl-btn rounded-full bg-ink px-4 py-2.5 text-[13px] font-bold text-white no-underline">See plan</Link>
            </div>
          )}
        </div>
      </aside>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="cl-up cl-d3 flex flex-col gap-9 rounded-[30px] border border-line bg-white p-6 md:p-12 lg:col-span-7">
        <fieldset>
          <legend className="mb-3.5 font-display text-2xl font-bold">What&apos;s your goal?</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {GOALS.map((g) => (
              <button key={g.id} type="button" aria-pressed={goal === g.id} onClick={() => setGoal(g.id)} className={`min-h-11 rounded-[18px] border-2 p-[18px] text-left ${goal === g.id ? "border-green bg-mint" : "border-line bg-white"}`}>
                <span className="block font-display text-lg font-bold">{g.t}</span><span className="mt-1 block text-[13px] text-body">{g.d}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3.5 font-display text-2xl font-bold">About you</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={lab}>Sex<select value={sex} onChange={(e) => setSex(e.target.value as "female" | "male")} className={field}><option value="female">Female</option><option value="male">Male</option></select></label>
            <label className={lab}>Age<input type="number" inputMode="numeric" min={18} max={90} value={age} onChange={(e) => setAge(+e.target.value)} className={field} /></label>
            <label className={lab}>Height (cm)<input type="number" inputMode="numeric" min={120} max={230} value={height} onChange={(e) => setHeight(+e.target.value)} className={field} /></label>
            <label className={lab}>Current weight (kg)<input type="number" inputMode="decimal" min={35} max={250} value={weight} onChange={(e) => setWeight(+e.target.value)} className={field} /></label>
            <label className={lab}>Goal weight (kg)<input type="number" inputMode="decimal" min={35} max={250} value={goalWeight} onChange={(e) => setGoalWeight(+e.target.value)} className={field} /></label>
            <label className={lab}>Activity<select value={activity} onChange={(e) => setActivity(e.target.value as typeof activity)} className={field}>{ACTIVITIES.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}</select></label>
          </div>
          {!valid && <p role="alert" className="mt-3 text-sm text-price-red">Enter an age of 18 or over, plus your height and weight, to see your target.</p>}
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 font-display text-2xl font-bold">What don&apos;t you eat?</legend>
          <p className="mb-3.5 text-sm text-muted">We&apos;ll remove these from every menu you get.</p>
          <div className="flex flex-wrap gap-2.5">
            {PREFS.map((p) => (
              <button key={p} type="button" aria-pressed={prefs.includes(p)} onClick={() => toggle(p)} className={`tap rounded-full border px-[18px] text-sm font-medium ${prefs.includes(p) ? "border-ink bg-ink text-white" : "border-input-line bg-white"}`}>{prefs.includes(p) ? "✓ " : ""}{p}</button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3.5 font-display text-2xl font-bold">How hot do you like it?</legend>
          <div className="flex items-center gap-4 text-sm">
            <span>Mild</span>
            <input type="range" min={1} max={5} step={1} value={pepper} onChange={(e) => setPepper(+e.target.value)} aria-label="Pepper level" aria-valuetext={PEPPER[pepper - 1]} className="h-2 flex-1 accent-red" />
            <span>Naija hot</span>
          </div>
          <p className="mt-2 text-center text-sm text-muted">{PEPPER[pepper - 1]}</p>
        </fieldset>

        <p className="rounded-2xl bg-[#FFF7E0] px-[18px] py-4 text-[13px] leading-relaxed text-[#5A4A12]">Pregnant, breastfeeding, under 18, or managing diabetes or kidney disease? Please check with your doctor before starting a calorie-reduced plan. Our plans support weight management and are not medical treatment.</p>
        {msg && <p role="alert" className="text-sm text-price-red">{msg}</p>}
        {done && <p role="status" className="rounded-2xl bg-mint px-4 py-3 text-sm text-green-dark">{signedIn ? "Saved to your profile." : <>Saved on this device. <Link href="/signin?callbackUrl=/account" className="font-bold underline">Sign in</Link> to keep it in your account.</>}</p>}

        <div className="flex items-center justify-between">
          <Link href="/" className="font-bold text-ink no-underline">← Back</Link>
          <button disabled={pending || !valid} className="cl-btn min-h-12 rounded-full bg-yellow px-8 text-base font-bold text-ink disabled:opacity-60">{pending ? "Saving…" : "See My Plan →"}</button>
        </div>
      </form>
    </section>
  );
}
