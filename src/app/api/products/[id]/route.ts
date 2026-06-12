// ============================================================
// GET /api/products/[id] — Get product
// PUT /api/products/[id] — Update product
// DELETE /api/products/[id] — Soft delete product
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, getMockProductById, mockProducts } from "@/lib/mock-data";
import { MIN_PRODUCT_PRICE } from "@/lib/constants";
import type { Product } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isUsingMockData()) {
      const product = getMockProductById(id);
      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: product });
    }

    return NextResponse.json(
      { success: false, error: "Product not found" },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.price && body.price < MIN_PRODUCT_PRICE) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum price is UGX ${MIN_PRODUCT_PRICE.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const product = getMockProductById(id);
      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      const updatedProduct: Product = {
        ...product,
        ...body,
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: updatedProduct });
    }

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isUsingMockData()) {
      const product = getMockProductById(id);
      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      // Soft delete - return updated product with inactive status
      const updatedProduct: Product = {
        ...product,
        status: "inactive",
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: updatedProduct });
    }

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
