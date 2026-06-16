// ============================================================
// Dynamic Sitemap — Auto-generated for SEO
// Includes homepage, about page, and all active public store/product pages
// ============================================================
import { MetadataRoute } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isUsingMockData, mockCreators, mockProducts } from "@/lib/mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://keevanstore.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ── Static Pages ──────────────────────────────────────────
  entries.push(
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    }
  );

  // ── Dynamic Store & Product Pages ─────────────────────────
  if (isUsingMockData()) {
    // Mock mode: generate entries from mock data
    for (const creator of mockCreators) {
      entries.push({
        url: `${BASE_URL}/store/${creator.username}`,
        lastModified: new Date(creator.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    const activeProducts = mockProducts.filter((p) => p.status === "active");
    for (const product of activeProducts) {
      const creator = mockCreators.find((c) => c.id === product.creatorId);
      if (creator) {
        entries.push({
          url: `${BASE_URL}/store/${creator.username}/${product.slug}`,
          lastModified: new Date(product.updatedAt),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } else {
    // Real Supabase: fetch all active creators and products
    try {
      const supabase = createServiceRoleClient();
      if (supabase) {
        // Get all active creators
        const { data: creators } = await supabase
          .from("creators")
          .select("username, updated_at")
          .eq("is_active", true);

        if (creators) {
          for (const creator of creators) {
            entries.push({
              url: `${BASE_URL}/store/${creator.username}`,
              lastModified: new Date(creator.updated_at),
              changeFrequency: "weekly",
              priority: 0.7,
            });
          }
        }

        // Get all active products with creator username
        const { data: products } = await supabase
          .from("products")
          .select("slug, updated_at, creator_id, creators(username)")
          .eq("status", "active");

        if (products) {
          for (const product of products) {
            const creatorUsername = (product.creators as unknown as { username: string } | null)?.username;
            if (creatorUsername) {
              entries.push({
                url: `${BASE_URL}/store/${creatorUsername}/${product.slug}`,
                lastModified: new Date(product.updated_at),
                changeFrequency: "weekly",
                priority: 0.6,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating sitemap:", error);
    }
  }

  return entries;
}
