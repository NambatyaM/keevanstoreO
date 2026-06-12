import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isUsingMockData, getMockCreator, getMockProductBySlug } from "@/lib/mock-data";
import { mapCreatorFromDb, mapProductFromDb } from "@/lib/db-mappers";
import { ProductPageClient } from "@/app/store/[username]/[slug]/product-page-client";
import type { Creator, Product } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://keevanstore.in";

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

async function getProductData(username: string, slug: string) {
  if (isUsingMockData()) {
    const creator = getMockCreator(username);
    if (!creator) return null;
    const product = getMockProductBySlug(username, slug);
    if (!product || product.status !== "active") return null;
    return { creator, product };
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

  const { data: productRow } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", creator.id)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!productRow) return null;

  const product = mapProductFromDb(productRow);

  return { creator, product };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  const data = await getProductData(username, slug);

  if (!data) {
    return {
      title: "Product Not Found | Keevan Store",
      description: "The product you are looking for does not exist or is no longer available.",
    };
  }

  const { creator, product } = data;
  const isEvent = product.type === "event";
  const title = `Buy ${product.title} by ${creator.displayName} | Keevan Store`;
  const description = product.description
    ? product.description.slice(0, 160)
    : `${product.title} by ${creator.displayName}. ${isEvent ? "Get your ticket now" : "Buy and download instantly"} on Keevan Store.`;
  const url = `${BASE_URL}/store/${username}/${slug}`;

  return {
    title,
    description,
    keywords: [
      product.title,
      creator.displayName,
      isEvent ? "event ticket" : "digital product",
      "Keevan Store",
      "Uganda",
      "mobile money",
    ],
    openGraph: {
      title,
      description,
      url,
      type: isEvent ? "website" : "website",
      images: product.thumbnailUrl ? [{ url: product.thumbnailUrl, alt: product.title }] : undefined,
    },
    twitter: {
      card: product.thumbnailUrl ? "summary_large_image" : "summary",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function PublicProductPage({ params }: Props) {
  const { username, slug } = await params;
  const data = await getProductData(username, slug);

  if (!data) {
    notFound();
  }

  const { creator, product } = data;
  const isEvent = product.type === "event";
  const url = `${BASE_URL}/store/${username}/${slug}`;

  // JSON-LD: Product schema
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || `${product.title} by ${creator.displayName}`,
    url,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "UGX",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Person",
        name: creator.displayName,
      },
    },
  };

  if (product.thumbnailUrl) {
    productSchema.image = product.thumbnailUrl;
  }

  // JSON-LD: Event schema (for event products)
  const eventSchema = isEvent
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: product.title,
        description: product.description || `Event by ${creator.displayName}`,
        url,
        startDate: product.eventDate || undefined,
        location: product.venue
          ? {
              "@type": "Place",
              name: product.venue,
              address: {
                "@type": "PostalAddress",
                addressCountry: "UG",
              },
            }
          : undefined,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: product.currency || "UGX",
          availability:
            product.capacity && product.ticketsSold >= product.capacity
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
        },
        organizer: {
          "@type": "Person",
          name: creator.displayName,
        },
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      )}
      <ProductPageClient creator={creator} product={product} username={username} slug={slug} />
    </>
  );
}
