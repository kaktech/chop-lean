import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Chop Lean | Calorie-counted Nigerian meal plans in Lagos",
    template: "%s | Chop Lean",
  },
  description:
    "Dietitian-planned Nigerian meals, cooked in Lagos and delivered chilled on Mon, Wed and Fri. Efo riro, jollof, pepper soup, calorie counted.",
};

export const viewport: Viewport = { themeColor: "#3D6B1F" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable} ${dmSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
