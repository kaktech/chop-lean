import { Button, EmailLayout, H1, P, SITE, fmtDate, type EmailOrder } from "./Layout";

const COPY: Record<string, { title: string; body: string }> = {
  cooking: { title: "Your meals are on the stove.", body: "The kitchen has started preparing your order." },
  out_for_delivery: { title: "Your rider is on the way.", body: "Please keep your phone close. Heat for 3 minutes and eat." },
  delivered: { title: "Delivered. Enjoy!", body: "We hope you love it. Log your weigh-in and leave a review from your account." },
  cancelled: { title: "Your order was cancelled.", body: "If you didn't ask for this, reply to this email or message us on WhatsApp." },
  pending_payment: { title: "We're waiting for your payment.", body: "Once payment is confirmed we'll start cooking." },
};

export default function StatusUpdate({ order, orderId, status }: { order: EmailOrder; orderId: string; status: string }) {
  const c = COPY[status] ?? { title: "Your order was updated.", body: "Open your order for the latest details." };
  return (
    <EmailLayout preview={`${order.number}: ${c.title}`} orderNumber={order.number}>
      <H1>{c.title}</H1>
      <P>Hi {order.firstName}, {c.body}</P>
      <P>Order {order.number} · {fmtDate(order.deliveryDate)}, {order.deliveryWindow}</P>
      <Button href={`${SITE}/order/${orderId}`}>View order</Button>
    </EmailLayout>
  );
}
