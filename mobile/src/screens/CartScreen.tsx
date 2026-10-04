import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, type CartLine } from "../api";
import { useCart } from "../cart";
import { C, naira } from "../theme";
import { Button, ErrorText } from "../ui";

export default function CartScreen() {
  const cart = useCart();
  const [busy, setBusy] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = (l: CartLine) => `${l.productId}:${JSON.stringify(l.options)}`;
  const change = async (l: CartLine, fn: () => Promise<void>) => {
    setBusy(key(l));
    try { await fn(); } catch { /* shown below via cart.error */ } finally { setBusy(null); }
  };

  const checkout = async () => {
    setError(null); setCheckingOut(true);
    try {
      const { url } = await api.handoff();
      await WebBrowser.openBrowserAsync(url);
      await cart.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't open checkout."); } finally { setCheckingOut(false); }
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.head}>
        <Text style={s.title}>Your cart</Text>
        <Text style={s.sync}>Synced with the website</Text>
      </View>
      <FlatList
        data={cart.lines}
        keyExtractor={key}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        renderItem={({ item: l }) => (
          <View style={[s.card, busy === key(l) && { opacity: 0.6 }]}>
            <Image source={{ uri: l.image }} style={s.img} contentFit="cover" transition={200} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.name} numberOfLines={2}>{l.name}</Text>
              <Text style={s.unit}>{naira(l.unitKobo)}{l.type === "plan" ? " / week" : ""}</Text>
              <View style={s.row}>
                <View style={s.stepper}>
                  <Pressable accessibilityLabel={`Decrease ${l.name}`} style={s.stepBtn} onPress={() => change(l, () => cart.setQty(l, l.qty - 1))}><Text style={s.stepText}>−</Text></Pressable>
                  <Text style={s.qty}>{l.qty}</Text>
                  <Pressable accessibilityLabel={`Increase ${l.name}`} style={s.stepBtn} onPress={() => change(l, () => cart.setQty(l, l.qty + 1))}><Text style={s.stepText}>+</Text></Pressable>
                </View>
                <Pressable accessibilityRole="button" onPress={() => change(l, () => cart.remove(l))} hitSlop={10}><Text style={s.remove}>Remove</Text></Pressable>
              </View>
            </View>
            <Text style={s.lineTotal}>{naira(l.unitKobo * l.qty)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Your cart is empty</Text>
            <Text style={s.emptyText}>Add something from the Menu tab, or on the website. It shows up here within a few seconds.</Text>
          </View>
        }
      />
      {cart.lines.length > 0 && (
        <View style={s.footer}>
          <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal ({cart.count} item{cart.count === 1 ? "" : "s"})</Text><Text style={s.total}>{naira(cart.totalKobo)}</Text></View>
          <Text style={s.note}>Delivery and promo codes are added at checkout.</Text>
          <ErrorText>{error ?? cart.error}</ErrorText>
          <Button title="Checkout" onPress={checkout} loading={checkingOut} />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  head: { paddingHorizontal: 16, paddingTop: 8, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  title: { color: C.text, fontSize: 30, fontWeight: "800" },
  sync: { color: C.green, fontSize: 12, fontWeight: "700" },
  card: { flexDirection: "row", gap: 12, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 12 },
  img: { width: 76, height: 76, borderRadius: 14, backgroundColor: C.surface2 },
  name: { color: C.text, fontSize: 15, fontWeight: "700" },
  unit: { color: C.muted, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 999 },
  stepBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  stepText: { color: C.text, fontSize: 20, fontWeight: "700" },
  qty: { color: C.text, fontSize: 15, fontWeight: "700", minWidth: 22, textAlign: "center" },
  remove: { color: C.muted, fontSize: 13, textDecorationLine: "underline" },
  lineTotal: { color: C.text, fontSize: 15, fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: "800" },
  emptyText: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 21 },
  footer: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.surface },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  totalLabel: { color: C.muted, fontSize: 14 },
  total: { color: C.text, fontSize: 24, fontWeight: "800" },
  note: { color: C.muted, fontSize: 12 },
});
