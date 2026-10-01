import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryZones, profiles } from "@/db/schema";
import { auth } from "@/auth";
import { CheckoutHeader } from "@/components/checkout/CheckoutShell";
import { googleReady } from "@/lib/features";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { describeDate, nextDeliveryDates, toISODate } from "@/lib/lagos-time";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [zones, session] = await Promise.all([db.select().from(deliveryZones).where(eq(deliveryZones.isActive, true)).orderBy(asc(deliveryZones.sort)), auth().catch(() => null)]);
  const profile = session?.user?.id ? (await db.select().from(profiles).where(eq(profiles.userId, session.user.id)).limit(1))[0] : null;
  const [first = "", ...rest] = (session?.user?.name ?? "").split(" ");
  const dates = nextDeliveryDates(new Date(), 3).map((d) => ({ iso: toISODate(d), ...describeDate(d) }));

  return (
    <>
      <CheckoutHeader step={2} />
      <CheckoutForm
        googleReady={googleReady()}
        zones={zones.map((z) => ({ id: z.id, name: z.name, areas: z.areas, feeKobo: z.feeKobo }))}
        dates={dates}
        user={session?.user ? { email: session.user.email ?? "", firstName: first, lastName: rest.join(" "), phone: profile?.phone ?? "" } : null}
      />
    </>
  );
}
