import { Body, Container, Head, Html, Img, Preview, Section, Text, Link } from "@react-email/components";
import type { ReactNode } from "react";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;

const c = { green: "#24421A", yellow: "#F6B81A", ink: "#15201A", muted: "#5B6560", line: "#E6E4DC", cream: "#F7F6F1" };

export function EmailLayout({ preview, orderNumber, children }: { preview: string; orderNumber?: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "24px 12px", background: c.cream, fontFamily: "'DM Sans', Arial, sans-serif", color: c.ink }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 16, border: `1px solid ${c.line}` }}>
          <Section style={{ padding: "22px 28px 16px", borderBottom: `1px solid ${c.line}` }}>
            <table width="100%" role="presentation"><tbody><tr>
              <td style={{ width: 40, verticalAlign: "middle" }}><Img src={`${SITE}/logo-mark.png`} alt="Chop Lean" width="36" height="36" style={{ display: "block", borderRadius: 18 }} /></td>
              <td style={{ verticalAlign: "middle", paddingLeft: 10 }}><span style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 20, color: c.ink }}>Chop<span style={{ color: c.green }}>Lean</span></span></td>
              {orderNumber && <td align="right" style={{ verticalAlign: "middle", color: c.muted, fontSize: 13 }}>Order {orderNumber}</td>}
            </tr></tbody></table>
          </Section>
          <Section style={{ padding: "26px 28px 8px" }}>{children}</Section>
          <Section style={{ padding: "8px 28px 24px" }}>
            <Text style={{ fontSize: 12, lineHeight: 1.5, color: c.muted, margin: 0 }}>
              Chop Lean · Lagos · <Link href={SITE} style={{ color: c.muted }}>chop-lean.vercel.app</Link><br />
              Our plans support weight management and are not medical treatment.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const H1 = ({ children }: { children: ReactNode }) => (
  <Text style={{ fontFamily: "Georgia, 'DM Serif Display', serif", fontSize: 24, lineHeight: 1.25, margin: "0 0 8px", color: c.ink }}>{children}</Text>
);
export const P = ({ children }: { children: ReactNode }) => <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 14px", color: "#3A4540" }}>{children}</Text>;

export function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={{ display: "inline-block", background: c.yellow, color: c.ink, fontWeight: 700, fontSize: 14, padding: "13px 24px", borderRadius: 999, textDecoration: "none" }}>{children}</Link>
  );
}

export type EmailOrder = {
  number: string; firstName: string; email: string; phone: string; address: string;
  deliveryDate: string; deliveryWindow: string; zoneName: string; paymentMethod: "card" | "transfer" | "pod" | null;
  subtotalKobo: number; discountKobo: number; deliveryKobo: number; podFeeKobo: number; totalKobo: number; promoCode: string | null;
  items: { name: string; qty: number; unitPriceKobo: number; isPlan?: boolean }[];
  notes?: string | null;
  paymentStatus?: "pending" | "awaiting_confirmation" | "paid" | "failed";
  paymentRef?: string | null;
  placedAt?: string;
};

export const fmtDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function OrderTable({ o }: { o: EmailOrder }) {
  const Row = ({ label, value, bold, color }: { label: ReactNode; value: ReactNode; bold?: boolean; color?: string }) => (
    <tr>
      <td style={{ padding: "7px 0", fontSize: 14, color: color ?? c.ink, fontWeight: bold ? 700 : 400 }}>{label}</td>
      <td align="right" style={{ padding: "7px 0", fontSize: 14, color: color ?? c.ink, fontWeight: 700 }}>{value}</td>
    </tr>
  );
  return (
    <table width="100%" role="presentation" style={{ border: `1px solid ${c.line}`, borderRadius: 14, padding: "10px 18px", margin: "6px 0 18px" }}>
      <tbody>
        {o.items.map((i, k) => (
          <Row key={k} label={`${i.name} × ${i.qty}${i.isPlan ? (i.qty > 1 ? " weeks" : " week") : ""}`} value={naira(i.unitPriceKobo * i.qty)} />
        ))}
        {o.discountKobo > 0 && <Row label={o.promoCode ?? "Discount"} value={`- ${naira(o.discountKobo)}`} color="#3D6B1F" />}
        <Row label={`Delivery · ${o.zoneName}`} value={o.deliveryKobo ? naira(o.deliveryKobo) : "Free"} />
        {o.podFeeKobo > 0 && <Row label="Pay on delivery fee" value={naira(o.podFeeKobo)} />}
        <tr><td colSpan={2} style={{ borderTop: `1px solid ${c.line}`, padding: 0 }} /></tr>
        <Row label="Total" value={naira(o.totalKobo)} bold />
      </tbody>
    </table>
  );
}

const METHOD_LABEL = { card: "Card (Paystack)", transfer: "Bank transfer", pod: "Pay on delivery" } as const;

export function DetailsBlock({ o }: { o: EmailOrder }) {
  const cell = { padding: "4px 0", fontSize: 14, verticalAlign: "top" as const };
  return (
    <table width="100%" role="presentation" style={{ margin: "0 0 18px" }}>
      <tbody>
        <tr><td style={{ ...cell, width: 130, color: c.muted }}>Order number</td><td style={{ ...cell, fontWeight: 700 }}>{o.number}</td></tr>
        {o.placedAt && <tr><td style={{ ...cell, color: c.muted }}>Placed</td><td style={cell}>{o.placedAt}</td></tr>}
        <tr><td style={{ ...cell, color: c.muted }}>Name</td><td style={cell}>{o.firstName}</td></tr>
        <tr><td style={{ ...cell, color: c.muted }}>Email</td><td style={cell}>{o.email}</td></tr>
        <tr><td style={{ ...cell, color: c.muted }}>Phone</td><td style={cell}>{o.phone}</td></tr>
        <tr><td style={{ ...cell, color: c.muted }}>Delivery</td><td style={cell}>{fmtDate(o.deliveryDate)}, {o.deliveryWindow}<br />{o.zoneName} · {o.address}</td></tr>
        {o.notes && <tr><td style={{ ...cell, color: c.muted }}>Kitchen notes</td><td style={cell}>{o.notes}</td></tr>}
      </tbody>
    </table>
  );
}

export function PaymentBlock({ o }: { o: EmailOrder }) {
  const paid = o.paymentStatus === "paid";
  const status = paid ? "Paid ✓" : o.paymentMethod === "pod" ? `Due on delivery: ${naira(o.totalKobo)}` : o.paymentStatus === "awaiting_confirmation" ? "Transfer reported, we're confirming it" : "Awaiting payment";
  return (
    <table width="100%" role="presentation" style={{ background: paid ? "#DCEFD2" : "#FCEBC9", borderRadius: 14, padding: "12px 18px", margin: "0 0 18px" }}>
      <tbody>
        <tr><td style={{ fontSize: 13, color: c.muted, padding: "2px 0" }}>Payment</td><td align="right" style={{ fontSize: 14, fontWeight: 700 }}>{o.paymentMethod ? METHOD_LABEL[o.paymentMethod] : "Not chosen"}</td></tr>
        <tr><td style={{ fontSize: 13, color: c.muted, padding: "2px 0" }}>Status</td><td align="right" style={{ fontSize: 14, fontWeight: 700 }}>{status}</td></tr>
        <tr><td style={{ fontSize: 13, color: c.muted, padding: "2px 0" }}>Amount</td><td align="right" style={{ fontSize: 14, fontWeight: 700 }}>{naira(o.totalKobo)}</td></tr>
        {o.paymentRef && <tr><td style={{ fontSize: 13, color: c.muted, padding: "2px 0" }}>Reference</td><td align="right" style={{ fontSize: 13, fontFamily: "'Courier New', monospace" }}>{o.paymentRef}</td></tr>}
      </tbody>
    </table>
  );
}
