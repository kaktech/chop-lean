import { EmailLayout, H1, P } from "./Layout";

export default function ContactMessage({ kind, name, email, phone, message, toAdmin }: { kind: "contact" | "gift"; name: string; email: string; phone?: string | null; message: string; toAdmin: boolean }) {
  const label = kind === "gift" ? "gift card request" : "message";
  return (
    <EmailLayout preview={toAdmin ? `New ${label} from ${name}` : `We got your ${label}`}>
      {toAdmin ? (
        <>
          <H1>New {label}</H1>
          <P><b>{name}</b> · {email}{phone ? ` · ${phone}` : ""}</P>
          <P>{message}</P>
        </>
      ) : (
        <>
          <H1>Thanks {name.split(" ")[0]}, we&apos;ve got it.</H1>
          <P>We received your {label} and will reply within one working day. Here&apos;s a copy:</P>
          <P>{message}</P>
        </>
      )}
    </EmailLayout>
  );
}
