import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Presence } from "@/components/presence";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://longbid.lol"),
  title: {
    default: "Longbid — Rank is the bid.",
    template: "%s · Longbid",
  },
  description:
    "Public pay-to-rank leaderboard for crypto products. Higher USDC bid. Higher rank. Nothing else.",
  openGraph: {
    title: "Longbid — Rank is the bid.",
    description: "Pay more. Rank higher. The only crypto leaderboard that does not lie.",
    type: "website",
    siteName: "Longbid",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Longbid — Rank is the bid." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Longbid — Rank is the bid.",
    description: "Pay more. Rank higher. The only crypto leaderboard that does not lie.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }, { url: "/logo-bid.png", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrains.variable} data-theme="dark" suppressHydrationWarning>
      <body className={`${jetbrains.className} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <Script id="lb-theme" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('lb_theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}`}
        </Script>
        <Presence />
        {children}
      </body>
    </html>
  );
}
