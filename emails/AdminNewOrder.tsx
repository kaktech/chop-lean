import { Button, EmailLayout, H1, OrderTable, P, SITE, fmtDate, type EmailOrder } from "./Layout";

export default function AdminNewOrder({ order, orderId }: { order: EmailOrder; orderId: string }) {
  return (
    <EmailLayout preview={`New order ${order.number}`} orderNumber={order.number}>
      <H1>New order {order.number}</H1>
      <P>{order.firstName} · {order.email} · {order.phone}<br />Payment: <b>{order.paymentMethod ?? "not chosen"}</b><br />Deliver {fmtDate(order.deliveryDate)}, {order.deliveryWindow}<br />{order.address}</P>
      <OrderTable o={order} />
      <Button href={`${SITE}/admin/payments`}>Open admin</Button>
      <P>Order id: {orderId}</P>
    </EmailLayout>
  );
}
