import { Text } from "@react-email/components";
import { Button, DetailsBlock, EmailLayout, H1, OrderTable, P, PaymentBlock, SITE, naira, type EmailOrder } from "./Layout";

export type BankInfo = { bankName: string; accountNumber: string; accountName: string };

export default function OrderConfirmation({ order, orderId, bank }: { order: EmailOrder; orderId: string; bank?: BankInfo }) {
  const transfer = order.paymentMethod === "transfer";
  const paid = order.paymentStatus === "paid";
  return (
    <EmailLayout preview={`Order ${order.number}: ${paid ? "paid and confirmed" : transfer ? "booked, awaiting your transfer" : "confirmed"}`} orderNumber={order.number}>
      <H1>Hi {order.firstName}, {paid ? "payment received and your order is confirmed." : "your first week is booked."}</H1>
      <P>Here&apos;s everything about your order. You can swap any meal until Thursday 6pm.</P>
      <OrderTable o={order} />
      <PaymentBlock o={order} />
      {transfer && bank && !paid && (
        <table width="100%" role="presentation" style={{ background: "#F7F6F1", borderRadius: 14, padding: "14px 18px", margin: "0 0 18px", border: "1px solid #E6E4DC" }}>
          <tbody>
            <tr><td><Text style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Transfer to hold your delivery</Text>
              <Text style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.7 }}>
                Bank: <b>{bank.bankName}</b><br />Account number: <b>{bank.accountNumber}</b><br />Account name: <b>{bank.accountName}</b><br />
                Amount: <b>{naira(order.totalKobo)}</b><br />Narration/reference: <b>{order.number}</b>
              </Text></td></tr>
          </tbody>
        </table>
      )}
      {order.paymentMethod === "pod" && <P>Please have {naira(order.totalKobo)} ready for the rider (cash or transfer).</P>}
      <DetailsBlock o={order} />
      <Button href={`${SITE}/order/${orderId}`}>View or track this order</Button>
    </EmailLayout>
  );
}
