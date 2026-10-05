import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "InternetYangu — Every shilling you spend on internet, finally visible",
  description:
    "Universal connectivity & spend monitor for Kenya and East Africa. Measure your connection, track every shilling across providers, and act on bad service — built for every network, not just satellite.",
  keywords: [
    "internet monitor",
    "data spend tracker",
    "Kenya ISP",
    "M-Pesa billing",
    "Starlink monitor",
    "cost per GB",
    "East Africa internet",
  ],
  authors: [{ name: "InternetYangu" }],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "InternetYangu",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "InternetYangu — Universal connectivity & spend monitor",
    description:
      "Measure your internet quality, track every shilling you spend across Safaricom, Faiba, Zuku, Airtel and Starlink, and act on bad service with evidence.",
    url: "/",
    siteName: "InternetYangu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternetYangu — Universal connectivity & spend monitor",
    description:
      "Measure, track and act: the internet monitor for every Kenyan network — not just satellite.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1628" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
