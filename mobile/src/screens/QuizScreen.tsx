import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, type QuizInput, type QuizResult } from "../api";
import { C, naira, serifItalic } from "../theme";
import { Button, Card, ErrorText, Field } from "../ui";

const GOALS = [["lose", "Lose weight", "A gentle, steady deficit"], ["keep", "Maintain", "Eat well, stay steady"], ["gain", "Build muscle", "More protein, more energy"]] as const;
const ACTIVITY = [["light", "Desk job, some walking"], ["moderate", "On my feet all day"], ["active", "Train 3+ times a week"]] as const;
const PREFS = ["No pork", "No beef", "No shellfish", "Pescatarian", "No swallow", "No groundnut", "Low salt", "No egg"];
const PEPPER = ["Mild", "Medium-mild", "Medium", "Hot", "Naija hot"];
const STEPS = ["Your goal", "About you", "Food preferences", "Spice level"];

export default function QuizScreen() {
  const nav = useNavigation<any>();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<QuizInput["goal"]>("lose");
  const [sex, setSex] = useState<QuizInput["sex"]>("female");
  const [age, setAge] = useState("29");
  const [height, setHeight] = useState("165");
  const [weight, setWeight] = useState("86");
  const [goalWeight, setGoalWeight] = useState("72");
  const [activity, setActivity] = useState<QuizInput["activity"]>("light");
  const [prefs, setPrefs] = useState<string[]>(["No pork", "No beef"]);
  const [pepper, setPepper] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  const num = (v: string) => Number(v.replace(",", "."));
  const valid = num(age) >= 18 && num(height) >= 120 && num(weight) >= 35;
  const next = () => {
    if (step === 1 && !valid) { setError("Enter an age of 18 or over, plus your height and weight."); return; }
    setError(null); setStep((n) => n + 1);
  };
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      setResult(await api.quiz({ goal, sex, age: Math.round(num(age)), heightCm: num(height), weightKg: num(weight), goalWeightKg: num(goalWeight) || undefined, activity, exclusions: prefs, pepper }));
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't work that out. Try again."); } finally { setBusy(false); }
  };

  if (result) {
    return (
      <SafeAreaView style={s.screen} edges={["top"]}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={s.eyebrow}>YOUR RESULT</Text>
          <Text style={s.h1}>A plan built around <Text style={s.accent}>your</Text> body.</Text>
          <Card style={{ gap: 14 }}>
            <Text style={s.label}>Your daily target</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}><Text style={s.big}>{result.dailyKcal.toLocaleString("en-NG")}</Text><Text style={s.muted}>kcal / day</Text></View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[[result.protein + " g", "protein"], ["3 meals", "+ 1 snack"], [result.pace.replace("about ", "≈ ").replace(" a week", "/wk"), "pace"]].map(([v, l]) => <View key={l} style={s.stat}><Text style={s.statV} numberOfLines={2}>{v}</Text><Text style={s.statL}>{l}</Text></View>)}
            </View>
          </Card>
          {result.match ? (
            <Card style={{ gap: 12 }}>
              <Text style={s.label}>Best match</Text>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Image source={{ uri: result.match.image }} style={{ width: 84, height: 84, borderRadius: 16 }} contentFit="cover" />
                <View style={{ flex: 1 }}><Text style={s.planName}>{result.match.name}</Text><Text style={s.muted}>{result.match.kcal?.toLocaleString("en-NG")} kcal/day · {naira(result.match.priceKobo)} / week</Text></View>
              </View>
              <Button title="See this plan" onPress={() => nav.navigate("Product", { slug: result.match!.slug, title: result.match!.name })} />
            </Card>
          ) : null}
          <Text style={s.muted}>{result.saved ? "Saved to your account, so it shows on the website too." : ""}</Text>
          <Text style={s.note}>Pregnant, breastfeeding, under 18, or managing diabetes or kidney disease? Please check with your doctor before starting a calorie-reduced plan. Our plans support weight management and are not medical treatment.</Text>
          <Button title="Retake the quiz" kind="outline" onPress={() => { setResult(null); setStep(0); }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const last = step === STEPS.length - 1;
  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Text style={s.eyebrow}>FIND MY PLAN</Text>
          <Text style={s.h1}>A plan built around <Text style={s.accent}>your</Text> body.</Text>
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}><Text style={s.muted}>Question {step + 1} of {STEPS.length}</Text><Text style={s.muted}>{STEPS[step]}</Text></View>
            <View style={{ flexDirection: "row", gap: 6 }}>{STEPS.map((_, i) => <View key={i} style={[s.bar, i <= step && { backgroundColor: C.yellow }]} />)}</View>
          </View>

          {step === 0 && GOALS.map(([k, t, d]) => (
            <Pressable key={k} onPress={() => setGoal(k)} style={[s.option, goal === k && s.optionOn]}><Text style={s.optionT}>{t}</Text><Text style={s.optionD}>{d}</Text></Pressable>
          ))}

          {step === 1 && (
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>{(["female", "male"] as const).map((k) => <Pressable key={k} onPress={() => setSex(k)} style={[s.seg, sex === k && s.segOn]}><Text style={[s.segT, sex === k && { color: C.bg }]}>{k === "female" ? "Female" : "Male"}</Text></Pressable>)}</View>
              <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
              <Field label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="number-pad" />
              <Field label="Current weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
              <Field label="Goal weight (kg)" value={goalWeight} onChangeText={setGoalWeight} keyboardType="decimal-pad" />
              <Text style={s.label}>Activity</Text>
              {ACTIVITY.map(([k, t]) => <Pressable key={k} onPress={() => setActivity(k)} style={[s.option, activity === k && s.optionOn, { paddingVertical: 14 }]}><Text style={s.optionT}>{t}</Text></Pressable>)}
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 12 }}>
              <Text style={s.muted}>We remove these from every menu you get.</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {PREFS.map((p) => { const on = prefs.includes(p); return <Pressable key={p} onPress={() => setPrefs((x) => (on ? x.filter((y) => y !== p) : [...x, p]))} style={[s.chip, on && s.chipOn]}><Text style={[s.chipT, on && { color: C.bg }]}>{on ? "✓ " : ""}{p}</Text></Pressable>; })}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 14 }}>
              <Text style={s.label}>How hot do you like it?</Text>
              <View style={{ flexDirection: "row", gap: 6 }}>{[1, 2, 3, 4, 5].map((n) => <Pressable key={n} onPress={() => setPepper(n)} style={[s.heat, n <= pepper && { backgroundColor: C.red }]} accessibilityLabel={PEPPER[n - 1]} />)}</View>
              <Text style={s.pepperName}>{PEPPER[pepper - 1]}</Text>
            </View>
          )}

          <ErrorText>{error}</ErrorText>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {step > 0 ? <Button title="Back" kind="outline" onPress={() => { setError(null); setStep((n) => n - 1); }} style={{ flex: 1 }} /> : null}
            <Button title={last ? "See my plan" : "Next"} onPress={last ? submit : next} loading={busy} style={{ flex: 2 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  eyebrow: { color: C.yellow, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  h1: { color: C.text, fontSize: 32, fontWeight: "800", letterSpacing: -0.8, lineHeight: 36 },
  accent: { color: C.yellow, fontFamily: serifItalic, fontStyle: "italic", fontWeight: "400" },
  muted: { color: C.muted, fontSize: 13 },
  label: { color: C.text, fontSize: 14, fontWeight: "700" },
  bar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: C.line },
  option: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 2, borderColor: C.line, padding: 18, gap: 4 },
  optionOn: { borderColor: C.green, backgroundColor: "#1B2A17" },
  optionT: { color: C.text, fontSize: 17, fontWeight: "800" },
  optionD: { color: C.muted, fontSize: 13 },
  seg: { flex: 1, minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: C.yellow, borderColor: C.yellow },
  segT: { color: C.text, fontWeight: "700", fontSize: 15 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, minHeight: 44, alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: C.text, borderColor: C.text },
  chipT: { color: C.text, fontSize: 14, fontWeight: "600" },
  heat: { flex: 1, height: 16, borderRadius: 8, backgroundColor: C.line },
  pepperName: { color: C.text, fontSize: 20, fontWeight: "800", textAlign: "center" },
  big: { color: C.green, fontSize: 56, fontWeight: "900", letterSpacing: -2 },
  stat: { flex: 1, backgroundColor: C.surface2, borderRadius: 14, padding: 10 },
  statV: { color: C.text, fontSize: 15, fontWeight: "800" },
  statL: { color: C.muted, fontSize: 11, marginTop: 2 },
  planName: { color: C.text, fontSize: 18, fontWeight: "800" },
  note: { color: "#F6D58A", fontSize: 12, lineHeight: 18, backgroundColor: "#3A2F14", padding: 14, borderRadius: 14 },
});
