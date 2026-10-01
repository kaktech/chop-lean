import { Text } from "@react-email/components";
import { EmailLayout, H1, P } from "./Layout";

const COPY = {
  login: ["Your sign-in code", "Enter this code on the Chop Lean sign-in page."],
  signup: ["Verify your email", "Enter this code to finish creating your Chop Lean account."],
  reset: ["Reset your password", "Enter this code, then choose a new password."],
} as const;

export default function LoginCode({ code, purpose = "login" }: { code: string; purpose?: "login" | "signup" | "reset" }) {
  const [title, line] = COPY[purpose];
  return (
    <EmailLayout preview={`Your Chop Lean code is ${code}`}>
      <H1>{title}</H1>
      <P>{line} It works once and expires in 10 minutes.</P>
      <Text style={{ fontFamily: "'Courier New', monospace", fontSize: 32, letterSpacing: 8, fontWeight: 700, background: "#F7F6F1", borderRadius: 12, padding: "14px 0", textAlign: "center", margin: "6px 0 18px" }}>{code}</Text>
      <P>If you didn&apos;t ask for this, you can ignore this email. Nobody can get in without the code.</P>
    </EmailLayout>
  );
}
