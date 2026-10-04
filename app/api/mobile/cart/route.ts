import { z } from "zod";
import { applyCartOp, loadCart } from "@/lib/cart-server";
import { fail, imageUrl, mobileUser, ok } from "@/lib/mobile-api";

const withImage = <T extends { image: string }>(lines: T[]) => lines.map((l) => ({ ...l, image: imageUrl(l.image) }));

/** The signed-in user's saved cart: the very same one the website reads and writes. */
export async function GET(req: Request) {
  const user = await mobileUser(req);
  if (!user) return fail("Please sign in again.", 401);
  return ok({ lines: withImage(await loadCart(user.id)) });
}

const op = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add"), productId: z.string().uuid(), qty: z.number().int().min(1).max(20).optional(), options: z.record(z.string(), z.unknown()).optional() }),
  z.object({ op: z.literal("setQty"), productId: z.string().uuid(), qty: z.number().int().min(0).max(20), options: z.record(z.string(), z.unknown()).optional() }),
  z.object({ op: z.literal("remove"), productId: z.string().uuid(), options: z.record(z.string(), z.unknown()).optional() }),
  z.object({ op: z.literal("clear") }),
]);

/** One change at a time (add, setQty, remove, clear), applied on the server so web and phone can't overwrite each other. */
export async function POST(req: Request) {
  const user = await mobileUser(req);
  if (!user) return fail("Please sign in again.", 401);
  const parsed = op.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("That cart change isn't valid.");
  try {
    return ok({ lines: withImage(await applyCartOp(user.id, parsed.data)) });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Couldn't update your cart.");
  }
}
