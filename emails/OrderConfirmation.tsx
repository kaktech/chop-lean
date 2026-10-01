import { Text } from "@react-email/components";
import { Button, EmailLayout, H1, OrderTable, P, SITE, fmtDate, naira, type EmailOrder } from "./Layout";

export type BankInfo = { bankName: string; accountNumber: string; accountName: string };

export default function OrderConfirmation({ order, orderId, bank }: { order: EmailOrder; orderId: string; bank?: BankInfo }) {
  const transfer = order.paymentMethod === "transfer";
  return (
    <EmailLayout preview={`Your Chop Lean order ${order.number} is ${transfer ? "booked, awaiting your transfer" : "confirmed"}`} orderNumber={order.number}>
      <H1>Hi {order.firstName}, your first week is booked.</H1>
      <P>Here&apos;s what&apos;s coming. You can swap any meal until Thursday 6pm.</P>
      <OrderTable o={order} />
      {transfer && bank && (
        <table width="100%" role="presentation" style={{ background: "#FCEBC9", borderRadius: 14, padding: "14px 18px", margin: "0 0 18px" }}>
          <tbody>
            <tr><td><Text style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Pay by bank transfer</Text>
              <Text style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.7 }}>
                Bank: <b>{bank.bankName}</b><br />Account number: <b>{bank.accountNumber}</b><br />Account name: <b>{bank.accountName}</b><br />
                Amount: <b>{naira(order.totalKobo)}</b><br />Reference: <b>{order.number}</b>
              </Text></td></tr>
          </tbody>
        </table>
      )}
      {order.paymentMethod === "pod" && <P>You chose pay on delivery. Please have {naira(order.totalKobo)} ready for the rider.</P>}
      <P><b>Delivery:</b> {fmtDate(order.deliveryDate)}, {order.deliveryWindow} · {order.address}</P>
      <Button href={`${SITE}/order/${orderId}`}>View this order</Button>
    </EmailLayout>
  );
}
