import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { useAuth } from "../auth";
import { C } from "../theme";
import { Button, ErrorText, Field } from "../ui";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setError(null); setBusy(true);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(false); }
  };
  const loginPassword = () => run(async () => { const r = await api.login(email, password); await signIn(r.token, r.user); });
  const sendCode = () => run(async () => { await api.sendCode(email); setCodeSent(true); });
  const verify = () => run(async () => { const r = await api.verifyCode(email, code); await signIn(r.token, r.user); });

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.logo}>Chop<Text style={{ color: C.green }}>Lean</Text></Text>
          <Text style={s.h1}>Welcome back</Text>
          <Text style={s.sub}>Use the same account as the website. Your cart and weight log are shared.</Text>

          <View style={s.tabs}>
            {(["password", "code"] as const).map((m) => (
              <Pressable key={m} onPress={() => { setMode(m); setError(null); }} style={[s.tab, mode === m && s.tabOn]}>
                <Text style={[s.tabText, mode === m && { color: C.bg }]}>{m === "password" ? "Password" : "Email me a code"}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 14, marginTop: 18 }}>
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" placeholder="you@email.com" editable={!codeSent || mode === "password"} />
            {mode === "password" ? (
              <>
                <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" placeholder="Your password" />
                <ErrorText>{error}</ErrorText>
                <Button title="Sign in" onPress={loginPassword} loading={busy} disabled={!email || !password} />
              </>
            ) : codeSent ? (
              <>
                <Text style={s.sub}>We emailed a 6-digit code to {email}.</Text>
                <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} textContentType="oneTimeCode" placeholder="123456" />
                <ErrorText>{error}</ErrorText>
                <Button title="Verify and sign in" onPress={verify} loading={busy} disabled={code.length !== 6} />
                <Button title="Send a new code" kind="outline" onPress={sendCode} disabled={busy} />
              </>
            ) : (
              <>
                <ErrorText>{error}</ErrorText>
                <Button title="Email me a code" onPress={sendCode} loading={busy} disabled={!email} />
                <Text style={s.hint}>New here? Enter your email and we&apos;ll create your account when you verify the code.</Text>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  body: { padding: 24, paddingTop: 36 },
  logo: { color: C.text, fontSize: 30, fontWeight: "800", marginBottom: 28 },
  h1: { color: C.text, fontSize: 32, fontWeight: "800" },
  sub: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  hint: { color: C.muted, fontSize: 13, lineHeight: 19 },
  tabs: { flexDirection: "row", gap: 6, marginTop: 24, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  tab: { flex: 1, minHeight: 44, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: C.yellow },
  tabText: { color: C.muted, fontWeight: "700", fontSize: 14 },
});
