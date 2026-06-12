// ============================================================
// Contact Page Layout — SEO metadata for client component page
// ============================================================
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Keevan Store",
  description:
    "Get in touch with Keevan Store for support, questions, or feedback. Contact our team via email, contact form, or visit our business location in Kampala, Uganda. We respond within 24-48 hours.",
  keywords: [
    "Keevan Store contact",
    "contact us",
    "support",
    "creator support Uganda",
    "Kampala Uganda business",
    "customer service",
  ],
  openGraph: {
    title: "Contact Us — Keevan Store",
    description:
      "Have a question or need help? Contact the Keevan Store team. We respond within 24-48 hours.",
    url: "https://keevanstore.in/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us — Keevan Store",
    description:
      "Have a question or need help? Contact the Keevan Store team. We respond within 24-48 hours.",
  },
  alternates: {
    canonical: "https://keevanstore.in/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
