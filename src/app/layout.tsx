import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keevan Store — Create Your Online Store in Minutes",
  description:
    "Sell digital products, event tickets, and accept donations. Built for Ugandan creators with mobile money payments. Start earning today.",
  keywords: [
    "Keevan Store",
    "online store",
    "digital products",
    "event tickets",
    "Uganda",
    "mobile money",
    "creator economy",
    "sell online",
  ],
  authors: [{ name: "Keevan Store" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Keevan Store — Create Your Online Store in Minutes",
    description:
      "Sell digital products, event tickets, and accept donations. Built for Ugandan creators.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Keevan Store",
    description: "Create your online store in minutes",
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
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
