/** WhatsApp number in international format without "+", e.g. 2348012345678. Falls back to the contact page when unset. */
const NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export const hasWhatsApp = NUMBER.length >= 10;
export const whatsappUrl = (text?: string) => (hasWhatsApp ? `https://wa.me/${NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "/contact");
