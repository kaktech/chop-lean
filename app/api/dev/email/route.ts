import { NextResponse } from "next/server";
import { createElement } from "react";
import { render } from "@react-email/render";
import { getBankDetails, getOrderFull } from "@/lib/orders";
import { toEmailOrder } from "@/lib/notify";
import OrderConfirmation from "@/emails/OrderConfirmation";
import PaymentConfirmed from "@/emails/PaymentConfirmed";
import StatusUpdate from "@/emails/StatusUpdate";
import LoginCode from "@/emails/LoginCode";

/** Development only: /api/dev/email?type=confirmation&order=<orderId> shows an email in the browser. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  const u = new URL(req.url);
  const type = u.searchParams.get("type") ?? "confirmation";
  const id = u.searchParams.get("order") ?? "";
  if (type === "code") return html(await render(createElement(LoginCode, { code: "482913" })));
  const f = /^[0-9a-f-]{36}$/i.test(id) ? await getOrderFull(id) : null;
  if (!f) return new NextResponse("Pass ?order=<order uuid> (from the /order/<uuid> URL).", { status: 400 });
  const order = toEmailOrder(f);
  const el = type === "paid" ? createElement(PaymentConfirmed, { order, orderId: id })
    : type === "status" ? createElement(StatusUpdate, { order, orderId: id, status: u.searchParams.get("status") ?? "out_for_delivery" })
    : createElement(OrderConfirmation, { order, orderId: id, bank: order.paymentMethod === "transfer" ? await getBankDetails() : undefined });
  return html(await render(el));
}

const html = (body: string) => new NextResponse(body, { headers: { "content-type": "text/html; charset=utf-8" } });
