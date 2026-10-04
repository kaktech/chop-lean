import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { C } from "./theme";

export function Button({ title, onPress, kind = "primary", loading, disabled, style }: { title: string; onPress: () => void; kind?: "primary" | "outline"; loading?: boolean; disabled?: boolean; style?: ViewStyle }) {
  const off = loading || disabled;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={off} style={({ pressed }) => [s.btn, kind === "primary" ? s.btnPrimary : s.btnOutline, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }, off && { opacity: 0.6 }, style]}>
      {loading ? <ActivityIndicator color={kind === "primary" ? C.bg : C.text} /> : <Text style={[s.btnText, kind === "primary" ? { color: C.bg } : { color: C.text }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={C.muted} style={[s.input, style]} {...rest} />
    </View>
  );
}

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[s.card, style]}>{children}</View>;
export const ErrorText = ({ children }: { children?: string | null }) => (children ? <Text style={s.error} accessibilityRole="alert">{children}</Text> : null);

const s = StyleSheet.create({
  btn: { minHeight: 50, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  btnPrimary: { backgroundColor: C.yellow },
  btnOutline: { borderWidth: 1, borderColor: C.line },
  btnText: { fontSize: 16, fontWeight: "700" },
  label: { color: C.text, fontSize: 13, fontWeight: "700" },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, color: C.text, paddingHorizontal: 14, fontSize: 16 },
  card: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 16 },
  error: { color: "#FF8E83", fontSize: 14 },
});
