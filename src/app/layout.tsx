import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "InternetYangu — Every shilling you spend on internet, finally visible",
  description:
    "Universal connectivity & spend monitor for Kenya and East Africa. Measure your connection, track every shilling across providers, and act on bad service — inspired by Dishylink, built for all networks.",
  keywords: [
    "internet monitor",
    "data spend tracker",
    "Kenya ISP",
    "M-Pesa billing",
    "Starlink monitor",
    "Dishylink",
    "East Africa internet",
  ],
  authors: [{ name: "InternetYangu" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "InternetYangu — Universal connectivity & spend monitor",
    description:
      "Measure your internet quality, track every shilling you spend across Safaricom, Faiba, Zuku, Airtel and Starlink, and act on bad service with evidence.",
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
