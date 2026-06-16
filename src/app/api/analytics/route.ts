// ============================================================
// GET /api/analytics — Get analytics data
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  isUsingMockData,
  getMockOrders,
  getMockProducts,
  getMockCreatorById,
  getMockPageViews,
} from "@/lib/mock-data";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapCreatorFromDb } from "@/lib/db-mappers";
import { verifyAuth } from "@/lib/auth-helpers";

function generateMockAnalytics(creatorId: string, range: string) {
  const now = new Date();
  let days = 30;

  switch (range) {
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    case "all":
      days = 365;
      break;
    default:
      days = 30;
  }

  const creator = getMockCreatorById(creatorId);
  const orders = getMockOrders(creatorId);
  const products = getMockProducts(creatorId);

  // Generate sales by day
  const salesByDay: { date: string; sales: number; revenue: number; views: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const sales = Math.floor(Math.random() * 8) + (days <= 7 ? 2 : 0);
    const revenue = Math.floor(Math.random() * 150000) + 5000;
    const views = Math.floor(Math.random() * 50) + 10;
    salesByDay.push({ date: dateStr, sales, revenue, views });
  }

  // Calculate totals from generated data
  const totalRevenue = salesByDay.reduce((sum, d) => sum + d.revenue, 0);
  const totalSales = salesByDay.reduce((sum, d) => sum + d.sales, 0);
  const totalViews = salesByDay.reduce((sum, d) => sum + d.views, 0);
  const conversionRate = totalViews > 0 ? +((totalSales / totalViews) * 100).toFixed(1) : 0;

  // Top products breakdown
  const topProducts = products
    .filter((p) => p.status === "active")
    .map((p) => ({
      name: p.title,
      sales: p.salesCount,
      revenue: p.salesCount * p.price,
      views: p.views,
      conversionRate: p.views > 0 ? +((p.salesCount / p.views) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Calculate changes (mock percentage changes)
  const revenueChange = +(Math.random() * 30 - 5).toFixed(1);
  const salesChange = +(Math.random() * 25 - 3).toFixed(1);
  const viewsChange = +(Math.random() * 20 - 10).toFixed(1);

  return {
    totalRevenue,
    totalSales,
    totalViews,
    conversionRate,
    salesByDay,
    topProducts,
    revenueChange,
    salesChange,
    viewsChange,
  };
}

function getDaysFromRange(range: string): number {
  switch (range) {
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
    case "all": return 365;
    default: return 30;
  }
}

export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get("creator_id");
    const range = request.nextUrl.searchParams.get("range") || "30d";

    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: "creator_id is required" },
        { status: 400 }
      );
    }

    // Authentication check — only the creator themselves can view their analytics
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: authentication required" },
        { status: 401 }
      );
    }

    if (authResult.userId !== creatorId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: you can only view your own analytics" },
        { status: 403 }
      );
    }

    // Validate range
    if (!["7d", "30d", "90d", "all"].includes(range)) {
      return NextResponse.json(
        { success: false, error: "Invalid range. Must be: 7d, 30d, 90d, or all" },
        { status: 400 }
      );
    }

    if (isUsingMockData()) {
      const creator = getMockCreatorById(creatorId);
      if (!creator) {
        return NextResponse.json(
          { success: false, error: "Creator not found" },
          { status: 404 }
        );
      }

      const data = generateMockAnalytics(creatorId, range);

      return NextResponse.json({
        success: true,
        data,
      });
    }

    // Real Supabase analytics query
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({
        success: true,
        data: {
          totalRevenue: 0,
          totalSales: 0,
          totalViews: 0,
          conversionRate: 0,
          salesByDay: [],
          topProducts: [],
          revenueChange: 0,
          salesChange: 0,
          viewsChange: 0,
        },
      });
    }

    const days = getDaysFromRange(range);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceDateStr = sinceDate.toISOString();

    // Get creator info
    const { data: creatorRow } = await serviceClient
      .from("creators")
      .select("*")
      .eq("id", creatorId)
      .single();

    if (!creatorRow) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    const creator = mapCreatorFromDb(creatorRow);

    // Get completed orders in date range
    const { data: orderRows } = await serviceClient
      .from("orders")
      .select("amount, creator_earning, created_at, product_id, status")
      .eq("creator_id", creatorId)
      .eq("status", "completed")
      .gte("created_at", sinceDateStr);

    const orders = orderRows || [];

    // Get page views in date range
    const { data: viewRows } = await serviceClient
      .from("page_views")
      .select("created_at, view_type")
      .eq("creator_id", creatorId)
      .gte("created_at", sinceDateStr);

    const views = viewRows || [];

    // Calculate totals
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.creator_earning), 0);
    const totalSales = orders.length;
    const totalViews = views.length;
    const conversionRate = totalViews > 0 ? +((totalSales / totalViews) * 100).toFixed(1) : 0;

    // Build salesByDay array
    const salesByDayMap = new Map<string, { sales: number; revenue: number; views: number }>();

    // Initialize all days with zeros
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      salesByDayMap.set(dateStr, { sales: 0, revenue: 0, views: 0 });
    }

    // Aggregate orders by day
    for (const order of orders) {
      const dateStr = (order.created_at as string).split("T")[0];
      const existing = salesByDayMap.get(dateStr);
      if (existing) {
        existing.sales += 1;
        existing.revenue += Number(order.creator_earning);
      }
    }

    // Aggregate views by day
    for (const view of views) {
      const dateStr = (view.created_at as string).split("T")[0];
      const existing = salesByDayMap.get(dateStr);
      if (existing) {
        existing.views += 1;
      }
    }

    const salesByDay = Array.from(salesByDayMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Get top products
    const { data: productRows } = await serviceClient
      .from("products")
      .select("id, title, price, sales_count, views, status")
      .eq("creator_id", creatorId);

    const products = productRows || [];

    // Calculate revenue per product from orders
    const productRevenueMap = new Map<string, number>();
    for (const order of orders) {
      const pid = order.product_id as string;
      productRevenueMap.set(pid, (productRevenueMap.get(pid) || 0) + Number(order.creator_earning));
    }

    const topProducts = products
      .filter((p) => p.status === "active")
      .map((p) => ({
        name: p.title,
        sales: Number(p.sales_count),
        revenue: productRevenueMap.get(p.id) || Number(p.sales_count) * Number(p.price),
        views: Number(p.views),
        conversionRate: Number(p.views) > 0 ? +((Number(p.sales_count) / Number(p.views)) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate period-over-period changes
    // Compare current period with the previous period of same length
    const prevSinceDate = new Date(sinceDate);
    prevSinceDate.setDate(prevSinceDate.getDate() - days);
    const prevSinceDateStr = prevSinceDate.toISOString();

    const { data: prevOrderRows } = await serviceClient
      .from("orders")
      .select("creator_earning")
      .eq("creator_id", creatorId)
      .eq("status", "completed")
      .gte("created_at", prevSinceDateStr)
      .lt("created_at", sinceDateStr);

    const prevOrders = prevOrderRows || [];
    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.creator_earning), 0);
    const prevSales = prevOrders.length;

    const { data: prevViewRows } = await serviceClient
      .from("page_views")
      .select("id")
      .eq("creator_id", creatorId)
      .gte("created_at", prevSinceDateStr)
      .lt("created_at", sinceDateStr);

    const prevViews = prevViewRows?.length || 0;

    const revenueChange = prevRevenue > 0 ? +(((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0;
    const salesChange = prevSales > 0 ? +(((totalSales - prevSales) / prevSales) * 100).toFixed(1) : 0;
    const viewsChange = prevViews > 0 ? +(((totalViews - prevViews) / prevViews) * 100).toFixed(1) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalSales,
        totalViews,
        conversionRate,
        salesByDay,
        topProducts,
        revenueChange,
        salesChange,
        viewsChange,
      },
    });
  } catch (error) {
    console.error("Error in analytics GET:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
