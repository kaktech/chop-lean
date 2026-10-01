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
      <Body style={{ margin: 0, background: c.cream, fontFamily: "'DM Sans', Arial, sans-serif", color: c.ink }}>
        <Container style={{ maxWidth: 600, margin: "24px auto", background: "#fff", borderRadius: 20, overflow: "hidden", border: `1px solid ${c.line}` }}>
          <Section style={{ background: c.green, padding: "22px 30px" }}>
            <table width="100%" role="presentation"><tbody><tr>
              <td><span style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 24, color: "#fff" }}>Chop<span style={{ color: c.yellow }}>Lean</span></span></td>
              {orderNumber && <td align="right" style={{ color: "#DCEFD2", fontSize: 13 }}>Order {orderNumber}</td>}
            </tr></tbody></table>
          </Section>
          <Img src={`${SITE}/images/meal-box.jpg`} alt="" width="600" height="180" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
          <Section style={{ padding: "30px" }}>{children}</Section>
          <Section style={{ padding: "0 30px 28px" }}>
            <Text style={{ fontSize: 12, color: c.muted, margin: 0 }}>
              Sent to you because you placed an order at Chop Lean. Our plans support weight management and are not medical treatment.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const H1 = ({ children }: { children: ReactNode }) => (
  <Text style={{ fontFamily: "Georgia, 'DM Serif Display', serif", fontSize: 28, lineHeight: 1.2, margin: "0 0 10px", color: c.ink }}>{children}</Text>
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
