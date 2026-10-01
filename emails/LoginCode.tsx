import { Text } from "@react-email/components";
import { EmailLayout, H1, P } from "./Layout";

export default function LoginCode({ code }: { code: string }) {
  return (
    <EmailLayout preview={`Your Chop Lean sign-in code is ${code}`}>
      <H1>Your sign-in code</H1>
      <P>Enter this code on the Chop Lean sign-in page. It works once and expires in 10 minutes.</P>
      <Text style={{ fontFamily: "'Courier New', monospace", fontSize: 38, letterSpacing: 10, fontWeight: 700, background: "#F7F6F1", borderRadius: 14, padding: "18px 0", textAlign: "center", margin: "6px 0 18px" }}>{code}</Text>
      <P>If you didn&apos;t ask for this, you can ignore this email. Nobody can sign in without the code.</P>
    </EmailLayout>
  );
}
