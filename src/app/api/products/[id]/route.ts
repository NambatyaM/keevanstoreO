// ============================================================
// GET /api/products/[id] — Get product
// PUT /api/products/[id] — Update product
// DELETE /api/products/[id] — Soft delete product
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isUsingMockData, getMockProductById, mockProducts } from "@/lib/mock-data";
import { MIN_PRODUCT_PRICE } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapProductFromDb, mapProductToDb } from "@/lib/db-mappers";
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

    // Real Supabase query
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: productRow, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !productRow) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = mapProductFromDb(productRow);
    return NextResponse.json({ success: true, data: product });
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

    // Real Supabase update
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Verify authenticated user owns this product
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check ownership
    const { data: existingProduct } = await supabase
      .from("products")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!existingProduct || existingProduct.creator_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Map camelCase updates to snake_case
    const dbUpdates = mapProductToDb(body);

    const { data: updatedRow, error: updateError } = await supabase
      .from("products")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedRow) {
      console.error("Error updating product:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update product" },
        { status: 500 }
      );
    }

    // If event fields are being updated, update the events table too
    if (body.venue || body.eventDate || body.capacity) {
      const eventUpdates: Record<string, unknown> = {};
      if (body.venue !== undefined) eventUpdates.venue = body.venue;
      if (body.eventDate !== undefined) eventUpdates.event_date = body.eventDate;
      if (body.capacity !== undefined) eventUpdates.capacity = body.capacity;

      await supabase
        .from("events")
        .update(eventUpdates)
        .eq("product_id", id);
    }

    const product = mapProductFromDb(updatedRow);
    return NextResponse.json({ success: true, data: product });
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

    // Real Supabase soft delete
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Verify authenticated user owns this product
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check ownership
    const { data: existingProduct } = await supabase
      .from("products")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!existingProduct || existingProduct.creator_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Soft delete: set status to inactive
    const { data: updatedRow, error: updateError } = await supabase
      .from("products")
      .update({ status: "inactive" })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedRow) {
      console.error("Error deleting product:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to delete product" },
        { status: 500 }
      );
    }

    const product = mapProductFromDb(updatedRow);
    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
