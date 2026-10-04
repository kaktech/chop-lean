import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, type Product } from "../api";
import { useCart } from "../cart";
import { C, naira } from "../theme";
import { Button, ErrorText } from "../ui";

const TABS = [["plan", "Meal plans"], ["meal", "Meals"], ["drink", "Drinks"]] as const;

export default function MenuScreen() {
  const cart = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("plan");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setProducts((await api.products()).products); setError(null); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't load the menu."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => (products ?? []).filter((p) => p.type === tab), [products, tab]);
  const qtyOf = (id: string) => cart.lines.filter((l) => l.productId === id).reduce((n, l) => n + l.qty, 0);

  const add = async (p: Product) => {
    setAdding(p.id);
    try { await cart.add(p.id); } catch { /* the cart shows the error */ } finally { setAdding(null); }
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.head}>
        <Text style={s.title}>Menu</Text>
        <View style={s.tabs}>
          {TABS.map(([k, label]) => (
            <Pressable key={k} onPress={() => setTab(k)} style={[s.tab, tab === k && s.tabOn]}>
              <Text style={[s.tabText, tab === k && { color: C.bg }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {products === null && !error ? <ActivityIndicator color={C.yellow} style={{ marginTop: 40 }} /> : null}
      {error && !products ? <View style={{ padding: 20, gap: 12 }}><ErrorText>{error}</ErrorText><Button title="Try again" onPress={load} /></View> : null}
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
        refreshControl={<RefreshControl tintColor={C.yellow} refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item: p }) => {
          const inCart = qtyOf(p.id);
          return (
            <View style={s.card}>
              <Image source={{ uri: p.image }} style={s.img} contentFit="cover" transition={200} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.name} numberOfLines={2}>{p.name}</Text>
                <Text style={s.meta}>{p.kcal ? `${p.kcal.toLocaleString("en-NG")} kcal` : ""}{p.proteinG ? ` · ${p.proteinG}g protein` : ""}{p.type === "plan" ? ` · ${p.mealsPerDay ?? 3} meals · ${p.daysPerWeek ?? 5} days` : ""}</Text>
                <View style={s.row}>
                  <Text style={s.price}>{naira(p.priceKobo)}<Text style={s.per}>{p.type === "plan" ? " / week" : ""}</Text></Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Add ${p.name} to cart`} onPress={() => add(p)} disabled={adding === p.id} style={({ pressed }) => [s.add, pressed && { opacity: 0.8 }]}>
                    {adding === p.id ? <ActivityIndicator color={C.bg} /> : <Text style={s.addText}>{inCart ? `+ Add (${inCart})` : "+ Add"}</Text>}
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={products ? <Text style={{ color: C.muted, textAlign: "center", marginTop: 40 }}>Nothing here yet.</Text> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  head: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  title: { color: C.text, fontSize: 30, fontWeight: "800" },
  tabs: { flexDirection: "row", gap: 6, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  tab: { flex: 1, minHeight: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: C.yellow },
  tabText: { color: C.muted, fontWeight: "700", fontSize: 14 },
  card: { flexDirection: "row", gap: 14, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 12 },
  img: { width: 96, height: 96, borderRadius: 14, backgroundColor: C.surface2 },
  name: { color: C.text, fontSize: 16, fontWeight: "700" },
  meta: { color: C.muted, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
  price: { color: "#FF9D8F", fontSize: 17, fontWeight: "800" },
  per: { color: C.muted, fontSize: 12, fontWeight: "400" },
  add: { minHeight: 40, minWidth: 84, borderRadius: 999, backgroundColor: C.yellow, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  addText: { color: C.bg, fontWeight: "800", fontSize: 14 },
});
