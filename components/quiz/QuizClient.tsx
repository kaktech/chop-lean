"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { saveQuizProfile } from "@/app/actions/profile";
import type { QuizData } from "@/lib/quiz-schema";
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
const field = "min-h-12 rounded-[14px] border border-input-line bg-surface px-3.5 text-[15px] font-normal";

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
  const [step, setStep] = useState(0);

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

  const TITLES = ["Your goal", "About you", "Food preferences", "Spice level"];
  const last = step === TITLES.length - 1;
  const stepOk = step !== 1 || valid;
  const next = () => { if (!stepOk) { setMsg("Enter an age of 18 or over, plus your height and weight."); return; } setMsg(null); setStep((s) => Math.min(s + 1, TITLES.length - 1)); };

  const resultCard = (
    <div id="quiz-result" className="flex flex-col gap-3.5 rounded-3xl bg-surface p-6 text-fg md:p-7">
      <span className="label-sm text-[13px] text-muted">{done ? "Your daily target" : "Your estimate so far"}</span>
      <span className="flex items-baseline gap-2.5">
        <span className="font-display text-[52px] font-extrabold leading-none tracking-tight text-leaf md:text-[58px]" aria-live="polite">{calc ? (Math.round(calc.target / 10) * 10).toLocaleString("en-NG") : "–"}</span>
        <span className="text-muted">kcal / day</span>
      </span>
      <div className="grid grid-cols-3 gap-2 text-[13px]">
        {[[pace, paceLabel], [`${protein} g`, "protein"], ["3 meals", "+ 1 snack"]].map(([v, l]) => <span key={l} className="rounded-2xl bg-surface-2 p-3"><b className="block text-base">{v}</b>{l}</span>)}
      </div>
      {calc && calc.target === 1200 && goal === "lose" && <p className="text-xs text-muted">We never go below 1,200 kcal a day without a doctor&apos;s advice.</p>}
      {match && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3.5">
          <span className="min-w-0 flex-1 text-sm">Best match: <b>{match.name}</b> + zobo snack</span>
          <Link href={`/plans/${match.slug}`} className="cl-btn rounded-full bg-yellow px-5 py-3 text-sm font-bold text-canvas no-underline">See plan</Link>
        </div>
      )}
    </div>
  );

  return (
    <section className="container-x mx-auto flex max-w-[720px] flex-col gap-5 pb-24 pt-6 md:pt-12">
      <header className="flex flex-col gap-2">
        <span className="label-sm tracking-[0.16em] text-yellow">Find my plan</span>
        <h1 className="text-[32px] leading-[1.05] tracking-[-0.03em] md:text-[48px]">A plan built around <span className="font-serif font-normal italic text-yellow">your</span> body.</h1>
        <p className="text-muted">Four quick questions. We use the Mifflin-St Jeor formula, subtract a safe deficit and match you to a Chop Lean plan.</p>
      </header>

      {!done ? (
        <form method="post" onSubmit={(e) => { e.preventDefault(); if (last) submit(); else next(); }} className="flex flex-col gap-6 rounded-[26px] border border-line bg-surface p-5 md:p-9">
          <div>
            <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-muted"><span>Question {step + 1} of {TITLES.length}</span><span>{TITLES[step]}</span></div>
            <div className="flex gap-1.5" aria-hidden>{TITLES.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-yellow" : "bg-line"}`} />)}</div>
          </div>

          {step === 0 && (
            <fieldset>
              <legend className="mb-3.5 font-display text-2xl font-bold">What&apos;s your goal?</legend>
              <div className="grid gap-3">
                {GOALS.map((g) => (
                  <button key={g.id} type="button" aria-pressed={goal === g.id} onClick={() => setGoal(g.id)} className={`min-h-14 rounded-[18px] border-2 p-[18px] text-left ${goal === g.id ? "border-leaf bg-tint-green" : "border-line bg-surface"}`}>
                    <span className="block font-display text-lg font-bold">{g.t}</span><span className="mt-1 block text-[13px] text-body">{g.d}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="mb-3.5 font-display text-2xl font-bold">About you</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={lab}>Sex<select value={sex} onChange={(e) => setSex(e.target.value as "female" | "male")} className={field}><option value="female">Female</option><option value="male">Male</option></select></label>
                <label className={lab}>Age<input type="number" inputMode="numeric" min={18} max={90} value={age} onChange={(e) => setAge(+e.target.value)} className={field} /></label>
                <label className={lab}>Height (cm)<input type="number" inputMode="numeric" min={120} max={230} value={height} onChange={(e) => setHeight(+e.target.value)} className={field} /></label>
                <label className={lab}>Current weight (kg)<input type="number" inputMode="decimal" min={35} max={250} value={weight} onChange={(e) => setWeight(+e.target.value)} className={field} /></label>
                <label className={lab}>Goal weight (kg)<input type="number" inputMode="decimal" min={35} max={250} value={goalWeight} onChange={(e) => setGoalWeight(+e.target.value)} className={field} /></label>
                <label className={lab}>Activity<select value={activity} onChange={(e) => setActivity(e.target.value as typeof activity)} className={field}>{ACTIVITIES.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}</select></label>
              </div>
              {!valid && <p role="alert" className="mt-3 text-sm text-price-red">Enter an age of 18 or over, plus your height and weight, to see your target.</p>}
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="mb-1.5 font-display text-2xl font-bold">What don&apos;t you eat?</legend>
              <p className="mb-3.5 text-sm text-muted">We&apos;ll remove these from every menu you get.</p>
              <div className="flex flex-wrap gap-2.5">
                {PREFS.map((p) => (
                  <button key={p} type="button" aria-pressed={prefs.includes(p)} onClick={() => toggle(p)} className={`tap rounded-full border px-[18px] text-sm font-medium ${prefs.includes(p) ? "border-ink bg-ink text-white" : "border-input-line bg-surface"}`}>{prefs.includes(p) ? "✓ " : ""}{p}</button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset>
              <legend className="mb-3.5 font-display text-2xl font-bold">How hot do you like it?</legend>
              <div className="flex items-center gap-4 text-sm">
                <span>Mild</span>
                <input type="range" min={1} max={5} step={1} value={pepper} onChange={(e) => setPepper(+e.target.value)} aria-label="Pepper level" aria-valuetext={PEPPER[pepper - 1]} className="h-2 min-w-0 flex-1 accent-red" />
                <span>Naija hot</span>
              </div>
              <p className="mt-2 text-center font-display text-lg font-bold">{PEPPER[pepper - 1]}</p>
              <p className="mt-5 rounded-2xl bg-tint-amber px-[18px] py-4 text-[13px] leading-relaxed text-[#F6D58A]">Pregnant, breastfeeding, under 18, or managing diabetes or kidney disease? Please check with your doctor before starting a calorie-reduced plan. Our plans support weight management and are not medical treatment.</p>
            </fieldset>
          )}

          {step >= 1 && calc && <p className="text-center text-sm text-muted">Estimate so far: <b className="text-leaf">{(Math.round(calc.target / 10) * 10).toLocaleString("en-NG")} kcal/day</b></p>}
          {msg && <p role="alert" className="text-sm text-price-red">{msg}</p>}

          <div className="flex items-center justify-between gap-3">
            {step === 0 ? <Link href="/" className="tap flex items-center font-bold text-fg no-underline">← Home</Link> : <button type="button" onClick={() => { setMsg(null); setStep((s) => s - 1); }} className="tap font-bold text-fg">← Back</button>}
            <button disabled={pending || (last && !valid)} className="cl-btn min-h-12 rounded-full bg-yellow px-8 text-base font-bold text-canvas disabled:opacity-60">{pending ? "Saving…" : last ? "See my plan →" : "Next →"}</button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          {resultCard}
          <p role="status" className="rounded-2xl bg-tint-green px-4 py-3 text-sm text-leaf-soft">{signedIn ? "Saved to your profile." : <>Saved on this device. <Link href="/signin?callbackUrl=/account" className="font-bold underline">Sign in</Link> to keep it in your account.</>}</p>
          <button type="button" onClick={() => { setDone(false); setStep(0); }} className="tap self-start font-bold text-leaf underline">Retake the quiz</button>
        </div>
      )}
    </section>
  );
}
