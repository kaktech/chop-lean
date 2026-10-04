import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { Product } from "./api";
import { C, naira } from "./theme";

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }} accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => <Ionicons key={n} name={n <= Math.round(value) ? "star" : "star-outline"} size={size} color={C.yellow} />)}
    </View>
  );
}

export const Pill = ({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "dark" | "red" }) => (
  <View style={[s.pill, tone === "green" ? { backgroundColor: "#22351F" } : tone === "red" ? { backgroundColor: C.red } : { backgroundColor: C.surface2 }]}>
    <Text style={[s.pillText, tone === "green" ? { color: C.green } : tone === "red" ? { color: "#fff" } : { color: C.muted }]}>{children}</Text>
  </View>
);

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ gap: 4 }}>
      {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={s.sectionTitle}>{title}</Text>
        {action ? <Pressable onPress={onAction} hitSlop={10}><Text style={s.action}>{action}</Text></Pressable> : null}
      </View>
    </View>
  );
}

/** Vertical plan/meal/drink card used in lists and carousels. */
export function ProductCard({ p, rating, onPress, onAdd, adding, qty, width, style }: { p: Product; rating?: { count: number; avg: number }; onPress: () => void; onAdd?: () => void; adding?: boolean; qty?: number; width?: number; style?: ViewStyle }) {
  const sub = p.type === "plan" ? `${p.kcal?.toLocaleString("en-NG")} kcal · ${p.mealsPerDay ?? 3} meals · ${p.daysPerWeek ?? 5} days` : `${p.kcal ?? ""} kcal${p.proteinG ? ` · ${p.proteinG}g protein` : ""}`;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={p.name} style={({ pressed }) => [s.card, width ? { width } : null, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }, style]}>
      <View>
        <Image source={{ uri: p.image }} style={s.cardImg} contentFit="cover" transition={250} />
        {p.badge ? <View style={s.badge}><Text style={s.badgeText}>{p.badge}</Text></View> : null}
      </View>
      <View style={{ padding: 12, gap: 6 }}>
        <Text style={s.cardName} numberOfLines={2}>{p.name}</Text>
        <Text style={s.cardMeta} numberOfLines={1}>{sub}</Text>
        {rating && rating.count > 0 ? <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}><Stars value={rating.avg} size={12} /><Text style={s.cardMeta}>{rating.avg.toFixed(1)} ({rating.count})</Text></View> : null}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <Text style={s.price}>{naira(p.priceKobo)}<Text style={s.per}>{p.type === "plan" ? " / week" : ""}</Text></Text>
          {onAdd ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Add ${p.name} to cart`} onPress={onAdd} disabled={adding} style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.8 }]}>
              <Ionicons name={adding ? "hourglass-outline" : "add"} size={20} color={C.bg} />
              {qty ? <Text style={s.addQty}>{qty}</Text> : null}
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: "700" },
  eyebrow: { color: C.yellow, fontSize: 11, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase" },
  sectionTitle: { color: C.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  action: { color: C.yellow, fontSize: 14, fontWeight: "700" },
  card: { backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.line, overflow: "hidden" },
  cardImg: { width: "100%", height: 150, backgroundColor: C.surface2 },
  badge: { position: "absolute", top: 10, left: 10, backgroundColor: C.red, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  cardName: { color: C.text, fontSize: 16, fontWeight: "800" },
  cardMeta: { color: C.muted, fontSize: 12 },
  price: { color: "#FF9D8F", fontSize: 17, fontWeight: "800" },
  per: { color: C.muted, fontSize: 12, fontWeight: "400" },
  addBtn: { minWidth: 40, height: 40, borderRadius: 20, backgroundColor: C.yellow, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 10, gap: 2 },
  addQty: { color: C.bg, fontWeight: "800", fontSize: 13 },
});
