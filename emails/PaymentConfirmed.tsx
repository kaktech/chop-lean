import { Button, DetailsBlock, EmailLayout, H1, OrderTable, P, PaymentBlock, SITE, fmtDate, type EmailOrder } from "./Layout";

export default function PaymentConfirmed({ order, orderId }: { order: EmailOrder; orderId: string }) {
  return (
    <EmailLayout preview={`Payment received for ${order.number}`} orderNumber={order.number}>
      <H1>Payment received. Thank you, {order.firstName}!</H1>
      <P>Your order is confirmed and the kitchen is getting ready. First delivery: <b>{fmtDate(order.deliveryDate)}, {order.deliveryWindow}</b>.</P>
      <OrderTable o={order} />
      <PaymentBlock o={order} />
      <DetailsBlock o={order} />
      <Button href={`${SITE}/order/${orderId}`}>Track my order</Button>
    </EmailLayout>
  );
}
