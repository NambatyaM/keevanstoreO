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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://keevanstore.in";

export const metadata: Metadata = {
  title: {
    default: "Keevan Store — Create Your Online Store in Minutes",
    template: "%s | Keevan Store",
  },
  description:
    "Keevan Store lets creators in Uganda sell digital products, event tickets, and accept donations with mobile money payments (MTN MoMo, Airtel Money). No coding required. Start earning today.",
  keywords: [
    "Keevan Store",
    "online store Uganda",
    "sell digital products Uganda",
    "event tickets Uganda",
    "mobile money payments Uganda",
    "creator economy Uganda",
    "sell online Uganda",
    "MTN Mobile Money",
    "Airtel Money",
    "Pesapal",
    "digital downloads",
    "creator storefront",
  ],
  authors: [{ name: "Keevan Store" }],
  creator: "Keevan Store",
  publisher: "Keevan Store",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Keevan Store — Create Your Online Store in Minutes",
    description:
      "Keevan Store lets creators in Uganda sell digital products, event tickets, and accept donations with mobile money payments. Start earning today.",
    url: BASE_URL,
    siteName: "Keevan Store",
    type: "website",
    locale: "en_UG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Keevan Store — Create Your Online Store in Minutes",
    description:
      "Sell digital products, event tickets, and accept donations. Built for Ugandan creators with mobile money payments.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Organization schema for the entire site
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Keevan Store",
  url: BASE_URL,
  description:
    "Keevan Store is a creator commerce platform for Ugandan creators to sell digital products, event tickets, and accept donations with mobile money payments.",
  foundingLocation: {
    "@type": "Place",
    name: "Uganda",
  },
  areaServed: {
    "@type": "Country",
    name: "Uganda",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: "+256768345905",
    availableLanguage: ["English"],
    areaServed: {
      "@type": "Country",
      name: "Uganda",
    },
  },
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
