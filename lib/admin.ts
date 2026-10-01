import "server-only";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { auth, isAdminEmail } from "@/auth";

/** Server-side admin gate for pages and server actions (middleware only checks for a session cookie). */
export async function requireAdmin() {
  const session = await auth().catch(() => null);
  if (!session?.user) redirect("/signin?callbackUrl=/admin");
  if (!isAdminEmail(session.user.email)) notFound();
  return session.user;
}

export async function getSettings() {
  const [row] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  return row ?? { id: 1, bankName: null, accountNumber: null, accountName: null, theme: "editorial-green", setup: {} as Record<string, boolean> };
}

export const isInventoryLocked = async () => !!(await getSettings()).setup?.lockInventory;
