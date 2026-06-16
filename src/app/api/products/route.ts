// ============================================================
// GET /api/products — List products
// POST /api/products — Create product
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockProducts,
  getMockCreatorById,
  mockProducts,
} from "@/lib/mock-data";
import { MIN_PRODUCT_PRICE } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapProductFromDb, mapProductToDb } from "@/lib/db-mappers";
import { checkRateLimit, getClientId, rateLimitHeaders } from "@/lib/rate-limit";
// FIXED: Blueprint Phase 3 — Zod validation
import { createProductSchema } from "@/lib/validations";
import type { Product, ProductType, ProductStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get("creator_id");
    const type = request.nextUrl.searchParams.get("type");
    const status = request.nextUrl.searchParams.get("status");

    if (isUsingMockData()) {
      let products = creatorId ? getMockProducts(creatorId) : mockProducts;

      if (type) {
        products = products.filter((p) => p.type === type);
      }
      if (status) {
        products = products.filter((p) => p.status === status);
      }

      return NextResponse.json({
        success: true,
        data: products,
        total: products.length,
      });
    }

    // Real Supabase query
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    let query = supabase.from("products").select("*");

    if (creatorId) {
      query = query.eq("creator_id", creatorId);
    }
    if (type) {
      query = query.eq("type", type);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // If no status filter, show all products (including inactive) for the creator
    // For public queries (no creatorId), only show active
    if (!status && !creatorId) {
      query = query.eq("status", "active");
    }

    query = query.order("created_at", { ascending: false });

    const { data: productRows, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const products = (productRows || []).map((row) => mapProductFromDb(row));

    return NextResponse.json({
      success: true,
      data: products,
      total: products.length,
    });
  } catch (error) {
    console.error("Error in products GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 product creations per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`products:${clientId}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many product creation attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();

    // FIXED: Blueprint Phase 3 — Zod replaces manual validation
    const parsed = createProductSchema.safeParse({
      ...body,
      // Coerce price to number in case it arrives as a string from some clients
      price: typeof body.price === "string" ? parseInt(body.price, 10) : body.price,
    });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError?.message ?? "Invalid request data" },
        { status: 400 }
      );
    }

    const {
      creatorId,
      title,
      description,
      price,
      currency = "UGX",
      type,
      thumbnailUrl,
      fileUrl,
      fileName,
      fileSize,
      venue,
      eventDate,
      capacity,
    } = parsed.data;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + Date.now().toString(36);

    if (isUsingMockData()) {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        creatorId,
        title,
        slug,
        description: description || "",
        price,
        currency,
        type: type as ProductType,
        status: "active" as ProductStatus,
        thumbnailUrl: thumbnailUrl || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        venue: venue || null,
        eventDate: eventDate || null,
        capacity: capacity || null,
        ticketsSold: 0,
        views: 0,
        salesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist in mock data so it appears in subsequent requests
      mockProducts.push(newProduct);

      return NextResponse.json({
        success: true,
        data: newProduct,
      });
    }

    // Real Supabase insert
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== creatorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const productData = mapProductToDb({
      creatorId,
      title,
      slug,
      description: description || "",
      price,
      currency,
      type,
      status: "active",
      thumbnailUrl: thumbnailUrl || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      venue: venue || null,
      eventDate: eventDate || null,
      capacity: capacity || null,
    });

    const { data: productRow, error: insertError } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (insertError || !productRow) {
      console.error("Error creating product:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create product" },
        { status: 500 }
      );
    }

    const product = mapProductFromDb(productRow);

    // If type is event, also insert into events table
    if (type === "event" && venue && eventDate && capacity) {
      const { error: eventError } = await supabase
        .from("events")
        .insert({
          product_id: productRow.id,
          venue,
          event_date: eventDate,
          capacity,
          tickets_sold: 0,
        });

      if (eventError) {
        console.error("Error creating event:", eventError);
        // Don't fail the product creation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error in products POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
