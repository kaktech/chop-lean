import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, type Product, type Review } from "../api";
import { useAuth } from "../auth";
import { ProductCard, SectionTitle, Stars } from "../components";
import { C, SITE_IMG, serifItalic } from "../theme";
import { Button } from "../ui";

const TILES = [
  { t: "Meal plans", sub: "Weekly subscriptions", img: "ofada.jpg", nav: { tab: "plan" } },
  { t: "Breakfast", sub: "Moi moi, akara, plantain", img: "moi-moi.jpg", nav: { tab: "meal", slot: "breakfast" } },
  { t: "Swallow and soups", sub: "Efo riro, egusi, okra", img: "efo-riro.jpg", nav: { tab: "meal", slot: "dinner" } },
  { t: "Snacks and drinks", sub: "Zobo, tiger nut", img: "zobo.jpg", nav: { tab: "drink" } },
];

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratings, setRatings] = useState<Record<string, { count: number; avg: number }>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([api.products(), api.home()]);
      setProducts(p.products); setReviews(h.reviews); setRatings(h.ratings);
    } catch { /* offline: keep what's on screen */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const plans = products.filter((p) => p.type === "plan").slice(0, 6);
  const first = (user?.name ?? user?.email ?? "").split(/[ @]/)[0];

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.bar}><Text style={s.logo}>Chop<Text style={{ color: C.green }}>Lean</Text></Text><Text style={s.hello} numberOfLines={1}>{first ? `Hi, ${first}` : ""}</Text></View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl tintColor={C.yellow} refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
        <View style={s.notice}><Ionicons name="time-outline" size={14} color={C.yellow} /><Text style={s.noticeText}>Order by 6pm for next-day delivery · Mon · Wed · Fri</Text></View>

        <View style={s.hero}>
          <Image source={{ uri: `${SITE_IMG}hero-tall.jpg` }} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" transition={300} />
          <View style={s.heroShade} />
          <View style={s.heroBody}>
            <Text style={s.eyebrow}>DIETITIAN-PLANNED · LAGOS MEAL DELIVERY</Text>
            <Text style={s.h1}>LOSE WEIGHT EATING THE FOOD YOU <Text style={s.h1Accent}>grew up on</Text></Text>
            <Text style={s.heroSub}>Efo riro, ofada, jollof and pepper soup, cooked the Naija way with weighed portions and counted calories.</Text>
            <View style={{ gap: 10, marginTop: 6 }}>
              <Button title="Find my plan in 2 minutes" onPress={() => nav.navigate("Plan finder")} />
              <Button title="Explore the menu" kind="outline" onPress={() => nav.navigate("Menu")} style={{ borderColor: "rgba(255,255,255,0.5)" }} />
            </View>
          </View>
        </View>

        <View style={s.points}>
          {[["flame-outline", "Calories counted"], ["scale-outline", "Portions weighed"], ["bicycle-outline", "Mon · Wed · Fri delivery"]].map(([icon, label]) => (
            <View key={label} style={s.point}><View style={s.pointIcon}><Ionicons name={icon as any} size={18} color={C.yellow} /></View><Text style={s.pointText}>{label}</Text></View>
          ))}
        </View>

        <View style={s.section}>
          <SectionTitle eyebrow="Weekly plans" title="This week's plans" action="See all" onAction={() => nav.navigate("Menu", { tab: "plan" })} />
          <FlatList horizontal data={plans} keyExtractor={(p) => p.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16 }}
            renderItem={({ item }) => <ProductCard p={item} width={260} rating={ratings[item.id]} onPress={() => nav.navigate("Product", { slug: item.slug, title: item.name })} />} />
        </View>

        <View style={s.section}>
          <SectionTitle eyebrow="Explore" title="Find your next plate" />
          <View style={s.tiles}>
            {TILES.map((t) => (
              <Pressable key={t.t} onPress={() => nav.navigate("Menu", t.nav)} style={({ pressed }) => [s.tile, pressed && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel={t.t}>
                <Image source={{ uri: `${SITE_IMG}${t.img}` }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
                <View style={s.tileShade} />
                <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}><Text style={s.tileTitle}>{t.t}</Text><Text style={s.tileSub}>{t.sub}</Text></View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <SectionTitle eyebrow="Reviews" title="Real people. Real plates." />
          {reviews.length === 0 ? (
            <View style={s.emptyReview}><Text style={s.emptyTitle}>No reviews yet. Be the first.</Text><Text style={s.emptyText}>Open any plan or meal and tap Write a review. Yours shows up here and on the website straight away.</Text></View>
          ) : reviews.slice(0, 3).map((r) => (
            <View key={r.id} style={s.review}>
              <Stars value={r.rating} size={16} />
              <Text style={s.reviewBody}>“{r.body}”</Text>
              <Text style={s.reviewBy}>{r.name}{r.verified ? "  ·  Verified" : ""}{r.product ? `  ·  ${r.product}` : ""}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 },
  logo: { color: C.text, fontSize: 24, fontWeight: "800" },
  hello: { color: C.muted, fontSize: 14, maxWidth: 180 },
  notice: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#1B2A17", paddingVertical: 8 },
  noticeText: { color: C.text, fontSize: 12 },
  hero: { margin: 16, borderRadius: 28, overflow: "hidden", minHeight: 520, justifyContent: "flex-end", borderWidth: 1, borderColor: C.line },
  heroShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(14,18,16,0.55)" },
  heroBody: { padding: 20, gap: 10 },
  eyebrow: { color: C.yellow, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  h1: { color: C.text, fontSize: 34, fontWeight: "900", lineHeight: 36, letterSpacing: -1 },
  h1Accent: { color: C.yellow, fontFamily: serifItalic, fontWeight: "400", fontStyle: "italic", textTransform: "none", fontSize: 38 },
  heroSub: { color: "#E6E1D6", fontSize: 15, lineHeight: 22 },
  points: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  point: { flexDirection: "row", alignItems: "center", gap: 8 },
  pointIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "rgba(246,184,26,0.4)", alignItems: "center", justifyContent: "center" },
  pointText: { color: C.text, fontSize: 13 },
  section: { paddingHorizontal: 16, marginTop: 34, gap: 14 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "48%", height: 180, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: C.line, flexGrow: 1 },
  tileShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(14,18,16,0.45)" },
  tileTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  tileSub: { color: "#D8D3C8", fontSize: 12, marginTop: 2 },
  review: { backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 18, gap: 10 },
  reviewBody: { color: C.text, fontSize: 18, lineHeight: 26, fontFamily: serifItalic },
  reviewBy: { color: C.muted, fontSize: 13 },
  emptyReview: { borderRadius: 22, borderWidth: 1, borderStyle: "dashed", borderColor: C.line, padding: 18, gap: 6 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  emptyText: { color: C.muted, fontSize: 14, lineHeight: 21 },
});
