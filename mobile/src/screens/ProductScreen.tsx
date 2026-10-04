import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, type ProductDetail, type Review } from "../api";
import { useCart } from "../cart";
import { Pill, SectionTitle, Stars } from "../components";
import { C, naira } from "../theme";
import { Button, ErrorText } from "../ui";

const W = Dimensions.get("window").width;

export default function ProductScreen() {
  const { params } = useRoute<any>();
  const cart = useCart();
  const [p, setP] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ count: 0, avg: 0 });
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [slide, setSlide] = useState(0);

  const load = useCallback(async () => {
    try { const r = await api.product(params.slug); setP(r.product); setReviews(r.reviews); setStats(r.stats); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't load this item."); }
  }, [params.slug]);
  useEffect(() => { load(); }, [load]);

  if (!p) return <View style={s.center}>{error ? <View style={{ padding: 20, gap: 12 }}><ErrorText>{error}</ErrorText><Button title="Try again" onPress={load} /></View> : <ActivityIndicator color={C.yellow} />}</View>;

  const gallery = [p.image, ...p.gallery.filter((g) => g !== p.image)];
  const inCart = cart.lines.filter((l) => l.productId === p.id).reduce((n, l) => n + l.qty, 0);
  const isPlan = p.type === "plan";
  const macros: [string, string][] = isPlan
    ? [[`${p.kcal?.toLocaleString("en-NG") ?? "–"}`, "kcal / day"], [`${p.mealsPerDay ?? 3}`, "meals / day"], [`${p.daysPerWeek ?? 5}`, "days / week"]]
    : [[`${p.kcal ?? "–"}`, "kcal"], [`${p.proteinG ?? "–"}g`, "protein"], [`${p.carbsG ?? "–"}g`, "carbs"], [`${p.fatG ?? "–"}g`, "fat"]];

  const add = async () => {
    setState("adding");
    try { await cart.add(p.id, qty); setState("added"); setTimeout(() => setState("idle"), 1600); } catch { setState("idle"); }
  };
  const post = async () => {
    setMsg(null);
    if (!rating) { setMsg({ ok: false, text: "Choose a star rating." }); return; }
    setPosting(true);
    try {
      const r = await api.postReview({ productId: p.id, rating, body: text });
      setMsg({ ok: true, text: r.verified ? "Thanks! Your verified review is live." : "Thanks! Your review is live." });
      setRating(0); setText(""); await load();
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't post your review." }); }
    finally { setPosting(false); }
  };

  return (
    <SafeAreaView style={s.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View>
          <FlatList horizontal pagingEnabled showsHorizontalScrollIndicator={false} data={gallery} keyExtractor={(g) => g}
            onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => <Image source={{ uri: item }} style={{ width: W, height: 300 }} contentFit="cover" transition={250} />} />
          {gallery.length > 1 ? <View style={s.dots}>{gallery.map((g, i) => <View key={g} style={[s.dot, i === slide && s.dotOn]} />)}</View> : null}
          {p.badge ? <View style={s.badge}><Text style={s.badgeText}>{p.badge}</Text></View> : null}
        </View>

        <View style={s.body}>
          <Text style={s.name}>{p.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {stats.count > 0 ? <><Stars value={stats.avg} /><Text style={s.muted}>{stats.avg.toFixed(1)} ({stats.count} review{stats.count === 1 ? "" : "s"})</Text></> : <Text style={s.muted}>No reviews yet</Text>}
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <Text style={s.price}>{naira(p.priceKobo)}</Text>
            {p.compareAtKobo ? <Text style={s.compare}>{naira(p.compareAtKobo)}</Text> : null}
            {isPlan ? <Text style={s.muted}>per week</Text> : null}
          </View>

          <View style={s.macros}>{macros.map(([v, l]) => <View key={l} style={s.macro}><Text style={s.macroV}>{v}</Text><Text style={s.macroL}>{l}</Text></View>)}</View>

          {p.description ? <Text style={s.desc}>{p.description}</Text> : null}
          {p.tags?.length ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{p.tags.slice(0, 6).map((t) => <Pill key={t} tone="dark">{t}</Pill>)}</View> : null}

          <View style={s.info}>
            {[["bicycle-outline", "Delivered chilled Mon, Wed and Fri. Order by 6pm the day before."], ["swap-horizontal-outline", isPlan ? "Pause, skip or swap meals any time before Thursday 6pm." : "Order a single plate, or let a plan do the choosing."], ["shield-checkmark-outline", "Portions are weighed and every calorie is counted."]].map(([icon, t]) => (
              <View key={t} style={s.infoRow}><Ionicons name={icon as any} size={20} color={C.yellow} /><Text style={s.infoText}>{t}</Text></View>
            ))}
          </View>

          <View style={{ marginTop: 10, gap: 14 }}>
            <SectionTitle eyebrow="Reviews" title="What customers say" />
            {reviews.length === 0 ? <Text style={s.muted}>No reviews yet. Be the first to share how it went.</Text> : reviews.map((r) => (
              <View key={r.id} style={s.review}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Stars value={r.rating} /><Text style={s.muted}>{r.verified ? "Verified" : ""}</Text></View>
                <Text style={s.reviewBody}>{r.body}</Text>
                <Text style={s.muted}>{r.name}{r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` : ""}</Text>
              </View>
            ))}
            <View style={s.write}>
              <Text style={s.writeTitle}>Write a review</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>{[1, 2, 3, 4, 5].map((n) => <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}><Ionicons name={n <= rating ? "star" : "star-outline"} size={30} color={C.yellow} /></Pressable>)}</View>
              <TextInput value={text} onChangeText={setText} multiline placeholder="How was it? Taste, portion, how full you felt…" placeholderTextColor={C.muted} style={s.textarea} />
              {msg ? (msg.ok ? <Text style={{ color: C.green }}>{msg.text}</Text> : <ErrorText>{msg.text}</ErrorText>) : null}
              <Button title="Post review" onPress={post} loading={posting} disabled={text.trim().length < 10} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.bar}>
        <View style={s.stepper}>
          <Pressable style={s.stepBtn} onPress={() => setQty((n) => Math.max(1, n - 1))} accessibilityLabel="Decrease quantity"><Text style={s.stepText}>−</Text></Pressable>
          <Text style={s.qty}>{qty}</Text>
          <Pressable style={s.stepBtn} onPress={() => setQty((n) => Math.min(20, n + 1))} accessibilityLabel="Increase quantity"><Text style={s.stepText}>+</Text></Pressable>
        </View>
        <Button style={{ flex: 1 }} title={state === "added" ? `Added${inCart ? ` · ${inCart} in cart` : ""}` : `Add to cart · ${naira(p.priceKobo * qty)}`} onPress={add} loading={state === "adding"} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  dots: { position: "absolute", bottom: 12, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  dotOn: { backgroundColor: C.yellow, width: 18 },
  badge: { position: "absolute", top: 14, left: 14, backgroundColor: C.red, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  body: { padding: 16, gap: 14 },
  name: { color: C.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  muted: { color: C.muted, fontSize: 13 },
  price: { color: "#FF9D8F", fontSize: 28, fontWeight: "800" },
  compare: { color: C.muted, fontSize: 16, textDecorationLine: "line-through" },
  macros: { flexDirection: "row", gap: 10 },
  macro: { flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 12, alignItems: "center" },
  macroV: { color: C.text, fontSize: 20, fontWeight: "800" },
  macroL: { color: C.muted, fontSize: 11, marginTop: 2 },
  desc: { color: "#D8D3C8", fontSize: 15, lineHeight: 23 },
  info: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 14, gap: 12 },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoText: { color: C.text, fontSize: 14, lineHeight: 20, flex: 1 },
  review: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 14, gap: 8 },
  reviewBody: { color: C.text, fontSize: 15, lineHeight: 22 },
  write: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 14, gap: 12 },
  writeTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  textarea: { minHeight: 96, textAlignVertical: "top", borderRadius: 14, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg, color: C.text, padding: 12, fontSize: 15 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 12, alignItems: "center", padding: 12, paddingBottom: 22, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 999 },
  stepBtn: { width: 42, height: 46, alignItems: "center", justifyContent: "center" },
  stepText: { color: C.text, fontSize: 22, fontWeight: "700" },
  qty: { color: C.text, fontSize: 16, fontWeight: "800", minWidth: 24, textAlign: "center" },
});
