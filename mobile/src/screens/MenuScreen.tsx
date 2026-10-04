import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, type Product } from "../api";
import { useCart } from "../cart";
import { ProductCard } from "../components";
import { C } from "../theme";
import { Button, ErrorText } from "../ui";

type Tab = "plan" | "meal" | "drink";
const TABS: [Tab, string][] = [["plan", "Meal plans"], ["meal", "Meals"], ["drink", "Drinks"]];
const SLOTS: [string, string][] = [["all", "All"], ["breakfast", "Breakfast"], ["lunch", "Lunch"], ["dinner", "Dinner"]];

export default function MenuScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const cart = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [ratings, setRatings] = useState<Record<string, { count: number; avg: number }>>({});
  const [tab, setTab] = useState<Tab>("plan");
  const [slot, setSlot] = useState("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  // Home's category tiles open the menu already filtered.
  useEffect(() => {
    const p = route.params as { tab?: Tab; slot?: string } | undefined;
    if (p?.tab) { setTab(p.tab); setSlot(p.slot ?? "all"); setQ(""); }
  }, [route.params]);

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([api.products(), api.home()]);
      setProducts(p.products); setRatings(h.ratings); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't load the menu."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products ?? []).filter((p) => p.type === tab && (tab !== "meal" || slot === "all" || p.slot === slot) && (!term || p.name.toLowerCase().includes(term) || (p.description ?? "").toLowerCase().includes(term)));
  }, [products, tab, slot, q]);
  const qtyOf = (id: string) => cart.lines.filter((l) => l.productId === id).reduce((n, l) => n + l.qty, 0);
  const add = async (p: Product) => { setAdding(p.id); try { await cart.add(p.id); } catch { /* cart shows the error */ } finally { setAdding(null); } };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.head}>
        <Text style={s.title}>Menu</Text>
        <View style={s.search}><Ionicons name="search" size={18} color={C.muted} /><TextInput value={q} onChangeText={setQ} placeholder="Search dishes and plans" placeholderTextColor={C.muted} style={s.searchInput} returnKeyType="search" autoCorrect={false} />{q ? <Pressable onPress={() => setQ("")} hitSlop={10}><Ionicons name="close-circle" size={18} color={C.muted} /></Pressable> : null}</View>
        <View style={s.tabs}>
          {TABS.map(([k, label]) => (
            <Pressable key={k} onPress={() => { setTab(k); setSlot("all"); }} style={[s.tab, tab === k && s.tabOn]}><Text style={[s.tabText, tab === k && { color: C.bg }]}>{label}</Text></Pressable>
          ))}
        </View>
        {tab === "meal" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {SLOTS.map(([k, label]) => <Pressable key={k} onPress={() => setSlot(k)} style={[s.chip, slot === k && s.chipOn]}><Text style={[s.chipText, slot === k && { color: C.bg }]}>{label}</Text></Pressable>)}
          </ScrollView>
        ) : null}
      </View>
      {products === null && !error ? <ActivityIndicator color={C.yellow} style={{ marginTop: 40 }} /> : null}
      {error && !products ? <View style={{ padding: 20, gap: 12 }}><ErrorText>{error}</ErrorText><Button title="Try again" onPress={load} /></View> : null}
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        refreshControl={<RefreshControl tintColor={C.yellow} refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item: p }) => <ProductCard p={p} rating={ratings[p.id]} qty={qtyOf(p.id)} adding={adding === p.id} onAdd={() => add(p)} onPress={() => nav.navigate("Product", { slug: p.slug, title: p.name })} />}
        ListEmptyComponent={products ? <Text style={{ color: C.muted, textAlign: "center", marginTop: 40 }}>{q ? "Nothing matches your search." : "Nothing here yet."}</Text> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  head: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  title: { color: C.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surface, borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, minHeight: 46 },
  searchInput: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 8 },
  tabs: { flexDirection: "row", gap: 6, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  tab: { flex: 1, minHeight: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: C.yellow },
  tabText: { color: C.muted, fontWeight: "700", fontSize: 14 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, minHeight: 38, alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: C.text, borderColor: C.text },
  chipText: { color: C.text, fontSize: 14, fontWeight: "600" },
});
