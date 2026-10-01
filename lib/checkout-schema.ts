import { z } from "zod";

export const DELIVERY_WINDOWS = ["7am – 10am (before work)", "12pm – 3pm (office)", "5pm – 8pm (home)"] as const;

/** Nigerian mobile: 0803 000 0000, +234 803 000 0000 or 234803... */
export const NG_PHONE = /^(?:\+?234|0)[789][01]\d{8}$/;
export const normalizePhone = (v: string) => v.replace(/[\s\-()]/g, "");

export const lineSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(1).max(20),
  options: z
    .object({
      kcal: z.number().int().optional(),
      mealsPerDay: z.number().int().min(1).max(4).optional(),
      daysPerWeek: z.number().int().min(1).max(7).optional(),
      firstDelivery: z.string().optional(),
      exclusions: z.string().max(200).optional(),
      subscribe: z.boolean().optional(),
      swaps: z.record(z.string(), z.string()).optional(),
    })
    .default({}),
});
export type CheckoutLine = z.infer<typeof lineSchema>;

/** Address must be detailed: enough words, and an area (comma-separated landmark or a zone area). */
export function isDetailedAddress(address: string, zoneAreas: string): boolean {
  const a = address.trim();
  if (a.length < 20) return false;
  if (a.split(/\s+/).length < 4) return false;
  if (a.includes(",")) return true;
  const lower = a.toLowerCase();
  return zoneAreas.split(",").some((area) => area.trim() && lower.includes(area.trim().toLowerCase().replace(/ phase \d+/, "")));
}

export const ADDRESS_MESSAGE = 'Please provide a more detailed address. Add the area and a landmark (e.g. "Lekki Phase 1, opposite Circle Mall").';

export const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  phone: z.string().transform(normalizePhone).refine((v) => NG_PHONE.test(v), "Enter a valid Nigerian phone number, e.g. 0803 000 0000"),
  zoneId: z.string().min(1, "Choose a delivery zone"),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a delivery date"),
  deliveryWindow: z.enum(DELIVERY_WINDOWS),
  address: z.string().trim().max(400),
  notes: z.string().trim().max(300).optional(),
  promo: z.string().trim().toUpperCase().max(30).optional(),
  terms: z.boolean().refine((v) => v, "Please agree to the Terms and Privacy Policy to continue."),
  lines: z.array(lineSchema).min(1, "Your cart is empty").max(30),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
