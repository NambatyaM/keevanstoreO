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
  mockCreators,
  mockOrders,
  mockProducts,
} from "@/lib/mock-data";

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
  const salesByDay = [];
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

    // Real Supabase query
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
