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
import { MIN_PRODUCT_PRICE, PLATFORM_FEE_PERCENT } from "@/lib/constants";
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
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    } = body;

    if (!creatorId || !title || !price || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (price < MIN_PRODUCT_PRICE) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum price is UGX ${MIN_PRODUCT_PRICE.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

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

      return NextResponse.json({
        success: true,
        data: newProduct,
      });
    }

    // Real Supabase insert
    return NextResponse.json(
      { success: false, error: "Supabase not configured" },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
