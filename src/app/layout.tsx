import type { Metadata, Viewport } from "next";
import { Noto_Naskh_Arabic, Noto_Sans_Bengali, Noto_Sans_Devanagari, Onest, Outfit } from "next/font/google";
import "./globals.css";

// Ultraviolet's faces. next/font downloads them at build time and serves them from this site, so phones fetch nothing from Google.
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "500"], display: "swap", variable: "--font-outfit" });
const onest = Onest({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-onest" });
// The Urdu, Bengali and Hindi of the master's screens (the English / اردو / বাংলা / हिन्दी button). Naskh is plain and easy to read on a small phone.
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "700"], display: "swap", variable: "--font-bengali" });
const hindi = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "700"], display: "swap", variable: "--font-hindi" });
const urdu = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "500", "700"], display: "swap", variable: "--font-urdu" });

export const metadata: Metadata = {
  title: "Custom Order Manager",
  description: "Custom order tracking",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f9fc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${onest.variable} ${urdu.variable} ${bengali.variable} ${hindi.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
