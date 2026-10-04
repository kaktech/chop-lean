import React, { useCallback, useEffect, useState } from "react";
import { AppState, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, type Order, type WeightLog } from "../api";
import { useAuth } from "../auth";
import { C, naira } from "../theme";
import { Button, Card, ErrorText, Field } from "../ui";

type Me = Awaited<ReturnType<typeof api.me>>;
const STATUS: Record<string, string> = { pending_payment: "Awaiting payment", cooking: "Cooking", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kg, setKg] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, w, o] = await Promise.all([api.me(), api.weight(), api.orders()]);
      setMe(m); setLogs(w.logs); setOrders(o.orders);
    } catch { /* offline: keep what we have */ }
  }, []);
  useEffect(() => {
    load();
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") load(); });
    return () => sub.remove();
  }, [load]);

  const save = async () => {
    const n = Number(kg.replace(",", "."));
    if (!n || n < 30 || n > 300) { setMsg({ ok: false, text: "Enter a weight in kg, for example 82.5." }); return; }
    setSaving(true); setMsg(null);
    try { setLogs((await api.logWeight(n)).logs); setKg(""); setMsg({ ok: true, text: "Weigh-in saved. It's on the website too." }); }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't save that." }); }
    finally { setSaving(false); }
  };

  const latest = logs.at(-1)?.kg ?? me?.latestWeightKg ?? null;
  const first = logs[0]?.kg ?? me?.profile?.startWeightKg ?? null;
  const lost = first != null && latest != null ? +(first - latest).toFixed(1) : null;

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} refreshControl={<RefreshControl tintColor={C.yellow} refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
        <Text style={s.title}>Account</Text>
        <Card style={s.profile}>
          <View style={s.avatar}><Text style={s.avatarText}>{(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={1}>{user?.name ?? "Chop Lean customer"}</Text>
            <Text style={s.email} numberOfLines={1}>{user?.email}</Text>
          </View>
        </Card>

        <View style={s.stats}>
          {[["Daily target", me?.profile?.dailyKcalTarget ? `${me.profile.dailyKcalTarget.toLocaleString("en-NG")} kcal` : "–"], ["Weight", latest != null ? `${latest} kg` : "–"], ["Change", lost != null ? `${lost > 0 ? "−" : lost < 0 ? "+" : ""}${Math.abs(lost)} kg` : "–"]].map(([l, v]) => (
            <Card key={l} style={s.stat}><Text style={s.statLabel}>{l}</Text><Text style={s.statValue} numberOfLines={1}>{v}</Text></Card>
          ))}
        </View>

        <Card style={{ gap: 12 }}>
          <Text style={s.h2}>Log this week&apos;s weight</Text>
          <Field label="Weight (kg)" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="e.g. 83.6" />
          {msg && (msg.ok ? <Text style={{ color: C.green }}>{msg.text}</Text> : <ErrorText>{msg.text}</ErrorText>)}
          <Button title="Save weigh-in" onPress={save} loading={saving} disabled={!kg} />
          {logs.length > 0 && (
            <View style={{ gap: 6, marginTop: 4 }}>
              {logs.slice(-6).reverse().map((l) => (
                <View key={l.loggedOn} style={s.logRow}><Text style={s.logDate}>{l.loggedOn}</Text><Text style={s.logKg}>{l.kg} kg</Text></View>
              ))}
            </View>
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={s.h2}>Orders</Text>
          {orders.length === 0 ? <Text style={{ color: C.muted }}>No orders yet. Checkout from the Cart tab.</Text> : orders.map((o) => (
            <View key={o.id} style={s.order}>
              <View style={s.logRow}><Text style={s.orderNo}>{o.number}</Text><Text style={s.pill}>{STATUS[o.status] ?? o.status}</Text></View>
              <Text style={s.orderItems} numberOfLines={2}>{o.items.join(", ")}</Text>
              <Text style={s.orderTotal}>{naira(o.totalKobo)} · {new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</Text>
            </View>
          ))}
        </Card>

        <Button title="Sign out" kind="outline" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  title: { color: C.text, fontSize: 30, fontWeight: "800" },
  profile: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.yellow, alignItems: "center", justifyContent: "center" },
  avatarText: { color: C.bg, fontSize: 22, fontWeight: "800" },
  name: { color: C.text, fontSize: 18, fontWeight: "800" },
  email: { color: C.muted, fontSize: 14 },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, padding: 12 },
  statLabel: { color: C.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  statValue: { color: C.text, fontSize: 17, fontWeight: "800", marginTop: 4 },
  h2: { color: C.text, fontSize: 18, fontWeight: "800" },
  logRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logDate: { color: C.muted, fontSize: 14 },
  logKg: { color: C.text, fontSize: 14, fontWeight: "700" },
  order: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10, gap: 4 },
  orderNo: { color: C.text, fontWeight: "800" },
  pill: { color: C.bg, backgroundColor: C.green, fontSize: 12, fontWeight: "800", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: "hidden" },
  orderItems: { color: C.muted, fontSize: 14 },
  orderTotal: { color: C.text, fontSize: 14, fontWeight: "700" },
});
