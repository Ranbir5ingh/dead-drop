import type { Metadata, Viewport } from "next";
import { Caveat, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { SiteFrame } from "@/components/site-frame";
import "./globals.css";

const sans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dead Drop",
    template: "%s · Dead Drop",
  },
  description:
    "Hide a small treasure outdoors. Hunt someone else's by riddle. An AI referee checks the photo. No exact spots, no meetings.",
  applicationName: "Dead Drop",
  appleWebApp: {
    capable: true,
    title: "Dead Drop",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf3e8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${caveat.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Suspense fallback={<div className="shell" />}>
          <SiteFrame>{children}</SiteFrame>
        </Suspense>
      </body>
    </html>
  );
}
