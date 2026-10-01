/** Editorial copy per plan so each plan page tells its own story. Facts mirror the plan data (kcal, meals, tags). */
export type PlanContent = {
  tagline: string;
  accent: string; // gallery panel colour
  intro: string;
  highlights: { t: string; d: string }[];
  goodFor: string[];
  lessSuited: string;
  note?: string;
};

export const PLAN_CONTENT: Record<string, PlanContent> = {
  "naija-lean-1400": {
    tagline: "The flexible all-rounder", accent: "#3D6B1F",
    intro: "Our most popular plan. A balanced week of Nigerian classics at 1,400 kcal a day, with four calorie levels so you can start where it suits you.",
    highlights: [
      { t: "Balanced classics", d: "Efo riro, ofada, jollof, pepper soup and moi moi in rotation, so no two days feel the same." },
      { t: "Four calorie levels", d: "Choose 1,200, 1,400, 1,600 or 1,800 kcal a day. The price follows your choice." },
      { t: "Swap any dish", d: "Tap Swap on any dish for another of similar calories, until Thursday 6pm." },
    ],
    goodFor: ["Your first Chop Lean week", "Steady weight loss of around 0.5 kg a week", "Variety without thinking about it"],
    lessSuited: "If you want soup and swallow every day, look at Swallow Smart. For a low-carb week, try Low-Carb Owambe.",
  },
  "swallow-smart-1500": {
    tagline: "Soup every day", accent: "#8A4B1F",
    intro: "For people who can't imagine a week without swallow. Rich soups every day, paired with weighed oat, wheat and plantain swallows in 150g balls.",
    highlights: [
      { t: "Weighed swallows", d: "Oat, wheat and plantain swallow in measured 150g balls, so the calories are known." },
      { t: "Soups, not stews of oil", d: "Efo riro, egusi, okra and white soup cooked with measured oil." },
      { t: "1,500 kcal a day", d: "Three meals a day, five days a week, delivered chilled Mon, Wed and Fri." },
    ],
    goodFor: ["Swallow lovers who still want to lose weight", "Anyone who finds salads unsatisfying", "Families who eat soup daily"],
    lessSuited: "If you avoid swallow or want fewer carbs, Low-Carb Owambe is a better fit.",
  },
  "low-carb-owambe": {
    tagline: "Party flavour, fewer carbs", accent: "#7A2E2E",
    intro: "All the owambe flavour with cauliflower rice, grilled protein and pepper soup, at 1,300 kcal a day and about 80g of carbs.",
    highlights: [
      { t: "Cauliflower rice", d: "Cauli-blend jollof and fried rice with the taste you know and far fewer carbs." },
      { t: "Extra protein", d: "About 120g of protein a day from chicken, fish, prawns and egg." },
      { t: "Pepper stays in", d: "Suya salad, pepper soup and grilled fish with all the heat." },
    ],
    goodFor: ["Cutting carbs without bland food", "People who love suya, pepper soup and grilled fish", "A tighter calorie budget"],
    lessSuited: "If you train hard and need more energy, Protein Cut 1800 gives you more calories and protein.",
  },
  "protein-cut-1800": {
    tagline: "For people who train", accent: "#1F4E79",
    intro: "Four meals a day at 1,800 kcal with about 150g of protein, built for people who train three or more times a week and want to lean out.",
    highlights: [
      { t: "150g protein a day", d: "Grilled croaker, chicken, eggs and prawns at every meal." },
      { t: "Four meals a day", d: "Breakfast, lunch, dinner and a snack drink to keep energy up between sessions." },
      { t: "Room to train", d: "1,800 kcal a day, so a cut doesn't leave you flat at the gym." },
    ],
    goodFor: ["Training 3+ times a week", "Cutting while keeping muscle", "Bigger appetites"],
    lessSuited: "If you're not training, a lower-calorie plan like Naija Lean 1400 may suit you better.",
  },
  "naija-lean-1200": {
    tagline: "Gentle portions", accent: "#5E7D3A",
    intro: "Our smallest portions at 1,200 kcal a day, for shorter or less active bodies. It's the lowest we go: we never plan below 1,200 kcal.",
    highlights: [
      { t: "Smaller plates", d: "The same Naija classics in lighter, lower-calorie portions." },
      { t: "Our lowest level", d: "1,200 kcal is our floor. We don't go lower without a doctor's advice." },
      { t: "Same flexibility", d: "Swap any dish for another with similar calories until Thursday 6pm." },
    ],
    goodFor: ["Shorter or less active bodies", "A gentle start to losing weight", "Anyone who finds bigger plans too much food"],
    lessSuited: "If you train often or feel hungry, step up to Naija Lean 1400 or Protein Cut 1800.",
    note: "Please speak to your doctor before starting a calorie-reduced plan if you have a health condition.",
  },
  "steady-sugar-1500": {
    tagline: "Low-GI, steady energy", accent: "#2F6F68",
    intro: "Beans, unripe plantain, ofada and whole grains: lower glycaemic dishes that keep energy steady through the day, at 1,500 kcal.",
    highlights: [
      { t: "Low-GI staples", d: "Beans and unripe plantain, oats, ofada rice and soups built around slow-release carbs." },
      { t: "Nothing sugary", d: "No sweetened sauces or drinks. Sweetness comes from the ingredients themselves." },
      { t: "1,500 kcal a day", d: "Three meals a day, five days a week, with swaps until Thursday 6pm." },
    ],
    goodFor: ["Steadier energy and fewer afternoon slumps", "People who want to cut back on sugar and refined carbs"],
    lessSuited: "This is a food plan, not medical treatment. If you manage diabetes, speak to your doctor or dietitian before starting.",
    note: "Not a medical treatment. Speak to your doctor first if you manage diabetes.",
  },
  "office-lunch-lean": {
    tagline: "One labelled lunch a day", accent: "#6B5B1F",
    intro: "A single labelled lunch box, around 450 kcal, delivered for your working week. Add it to any dinner or breakfast plan, or use it on its own.",
    highlights: [
      { t: "Lunch only", d: "One lunch a day for five days, so it slots around the rest of your eating." },
      { t: "Around 450 kcal", d: "Efo riro, ofada, jollof and egusi in lighter office-friendly portions." },
      { t: "Desk-ready", d: "Labelled with the day and calories. Heat for 3 minutes in the office microwave." },
    ],
    goodFor: ["Skipping the office-canteen decision", "Adding structure without a full plan", "Teams ordering lunches together"],
    lessSuited: "If you want breakfast and dinner covered too, choose a three-meal plan.",
  },
};

export const planContentFor = (slug: string): PlanContent =>
  PLAN_CONTENT[slug] ?? { tagline: "Weekly plan", accent: "#3D6B1F", intro: "", highlights: [], goodFor: [], lessSuited: "" };
