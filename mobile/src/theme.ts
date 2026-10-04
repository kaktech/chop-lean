export const C = {
  bg: "#0E1210", surface: "#171D19", surface2: "#1F2722", line: "#2B3530", text: "#F4EFE6", muted: "#A7B1AA",
  yellow: "#F6B81A", green: "#92CF5C", red: "#E5483B", greenDeep: "#17785F",
};
export const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
import { Platform } from "react-native";
export const serifItalic = Platform.select({ ios: "Georgia-Italic", android: "serif", default: "serif" }) as string;
export const serif = Platform.select({ ios: "Georgia", android: "serif", default: "serif" }) as string;
export const SITE_IMG = "https://chop-lean.vercel.app/images/";
