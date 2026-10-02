import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Presence } from "@/components/presence";
import { Web3Provider } from "@/components/web3-provider";
import { shareDescription, siteDescription } from "@/lib/ethbid/copy";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const description = siteDescription();
const social = shareDescription();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ethbid.longbid.lol"),
  title: {
    default: "ETHBid. Rank is the onchain bid.",
    template: "%s · ETHBid",
  },
  description,
  openGraph: {
    title: "ETHBid. Rank is the onchain bid.",
    description: social,
    type: "website",
    siteName: "ETHBid",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "ETHBid. Rank is the onchain bid.",
    description: social,
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
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
