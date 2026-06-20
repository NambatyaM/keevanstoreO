import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getEnvValidation } from "@/lib/env-validation";
import { logServiceStatus } from "@/lib/graceful-degradation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.keevanstore.in";

// Validate environment variables at startup
if (typeof window === "undefined") {
  getEnvValidation();
  logServiceStatus();
}

export const metadata: Metadata = {
  title: {
    default: "Keevan Store — Create Your Online Store in Minutes | Sell Digital Products in Uganda",
    template: "%s | Keevan Store",
  },
  description:
    "Create your online store in minutes. Sell digital products, event tickets, and accept donations with mobile money payments (MTN MoMo, Airtel Money). Built for Ugandan creators. Free to start. Keep 90% of sales.",
  keywords: [
    "Keevan Store",
    "online store Uganda",
    "sell digital products Uganda",
    "event tickets Uganda",
    "mobile money payments Uganda",
    "MTN Mobile Money Uganda",
    "Airtel Money Uganda",
    "creator economy Uganda",
    "sell online Uganda",
    "Pesapal Uganda",
    "digital downloads Uganda",
    "creator storefront",
    "e-commerce platform Uganda",
    "sell e-books Uganda",
    "sell templates Uganda",
    "sell beats Uganda",
    "event ticketing Uganda",
    "donation platform Uganda",
    "Kampala online store",
    "Ugandan creators",
    "Africa e-commerce",
    "mobile commerce Uganda",
    "digital marketplace Uganda",
    "sell files online Uganda",
    "online payments Uganda",
  ],
  authors: [{ name: "Keevan Store" }],
  creator: "Keevan Store",
  publisher: "Keevan Store",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/logo-new.png",
  },
  openGraph: {
    title: "Keevan Store — Create Your Online Store in Minutes | Sell Digital Products in Uganda",
    description:
      "Create your online store in minutes. Sell digital products, event tickets, and accept donations with mobile money payments. Built for Ugandan creators. Free to start. Keep 90% of sales.",
    url: BASE_URL,
    siteName: "Keevan Store",
    type: "website",
    locale: "en_UG",
    images: [
      {
        url: "/logo-new.png",
        width: 1200,
        height: 630,
        alt: "Keevan Store - Create Your Online Store in Uganda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keevan Store — Create Your Online Store in Minutes | Uganda",
    description:
      "Sell digital products, event tickets, and accept donations with MTN MoMo and Airtel Money. Built for Ugandan creators. Free to start.",
    images: ["/logo-new.png"],
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
  verification: {
    google: "your-google-verification-code",
  },
};

// Organization schema for the entire site
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Keevan Store",
  url: BASE_URL,
  logo: `${BASE_URL}/logo-new.png`,
  description:
    "Keevan Store is a creator commerce platform for Ugandan creators to sell digital products, event tickets, and accept donations with mobile money payments.",
  foundingLocation: {
    "@type": "Place",
    name: "Uganda",
    address: {
      "@type": "PostalAddress",
      addressCountry: "UG",
    },
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

// SoftwareApplication schema for the platform
const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Keevan Store",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "UGX",
    description: "Free to create a store. 10% platform fee on sales.",
  },
  featureList: [
    "Digital product sales",
    "Event ticketing",
    "Donation platform",
    "Mobile money payments (MTN MoMo, Airtel Money)",
    "Analytics dashboard",
    "Custom store URLs",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
  },
};

// LocalBusiness schema for GEO
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Keevan Store",
  description:
    "Creator commerce platform for selling digital products, event tickets, and accepting donations with mobile money payments in Uganda.",
  url: BASE_URL,
  telephone: "+256768345905",
  address: {
    "@type": "PostalAddress",
    addressCountry: "UG",
    addressRegion: "Central",
    addressLocality: "Kampala",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "0.3476",
    longitude: "32.5825",
  },
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: "0.3476",
      longitude: "32.5825",
    },
    geoRadius: "500000",
  },
  openingHours: "Mo-Su 00:00-23:59",
  priceRange: "$$",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
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
