// /home/z/my-project/src/app/store/[username]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isUsingMockData, getMockStorePublicData } from "@/lib/mock-data";
import { mapCreatorFromDb, mapProductFromDb } from "@/lib/db-mappers";
import { StorePageClient } from "./store-page-client";
import type { Creator, Product } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://keevanstore.in";

interface Props {
  params: Promise<{ username: string }>;
}

async function getStoreData(username: string) {
  if (isUsingMockData()) {
    const storeData = getMockStorePublicData(username);
    if (!storeData) return null;
    return storeData;
  }

  const supabase = createServiceRoleClient();
  if (!supabase) return null;

  const { data: creatorRow } = await supabase
    .from("creators")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (!creatorRow) return null;

  const creator = mapCreatorFromDb(creatorRow);

  const { data: productRows } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", creator.id)
    .eq("status", "active");

  const products = (productRows || []).map((row) => mapProductFromDb(row));

  return { creator, products };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const storeData = await getStoreData(username);

  if (!storeData) {
    return {
      title: "Store Not Found | Keevan Store",
      description: "The store you are looking for does not exist or has been deactivated.",
    };
  }

  const { creator } = storeData;
  const title = `${creator.displayName} — Online Store | Keevan Store`;
  const description = creator.bio || `Shop digital products and event tickets from ${creator.displayName} on Keevan Store. Secure payments via mobile money.`;
  const url = `${BASE_URL}/store/${username}`;

  return {
    title,
    description,
    keywords: [
      creator.displayName,
      creator.username,
      "Keevan Store",
      "digital products",
      "event tickets",
      "Uganda",
      "online store",
    ],
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: creator.photoUrl ? [{ url: creator.photoUrl }] : undefined,
    },
    twitter: {
      card: creator.photoUrl ? "summary_large_image" : "summary",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function PublicStorePage({ params }: Props) {
  const { username } = await params;
  const storeData = await getStoreData(username);

  if (!storeData) {
    notFound();
  }

  const { creator, products } = storeData;

  // JSON-LD: Person/ProfilePage schema for creator store
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${creator.displayName} — Keevan Store`,
    description: creator.bio || `Online store for ${creator.displayName}`,
    url: `${BASE_URL}/store/${username}`,
    mainEntity: {
      "@type": "Person",
      name: creator.displayName,
      identifier: `@${creator.username}`,
    },
  };

  // JSON-LD: FAQPage schema for store
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How do I buy a digital product from ${creator.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Browse the products on ${creator.displayName}'s store page, click "Buy Now" on the product you want, enter your name and email, choose a payment method (MTN Mobile Money, Airtel Money, bank transfer, or card), and complete the payment. You will receive a download link by email within minutes.`,
        },
      },
      {
        "@type": "Question",
        name: `What payment methods does ${creator.displayName} accept?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${creator.displayName} accepts MTN Mobile Money, Airtel Money, bank transfer, and card payments. All payments are processed securely through Pesapal.`,
        },
      },
      {
        "@type": "Question",
        name: `How long does delivery take after purchase from ${creator.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Digital products are delivered instantly after payment. You will receive a download link by email that is valid for 24 hours. Event tickets are also delivered by email with a QR code for check-in.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <StorePageClient creator={creator} products={products} username={username} />
    </>
  );
}
