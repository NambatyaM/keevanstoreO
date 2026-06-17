import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUsingMockData } from "@/lib/mock-data";

export async function GET() {
  if (isUsingMockData()) {
    return NextResponse.json({
      status: "using_mock_data",
      message: "App is using mock data (Supabase not configured)",
      configured: false,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        status: "error",
        message: "Supabase client could not be created",
        configured: false,
      });
    }

    // Try to query creators table
    const { data, error, count } = await supabase
      .from("creators")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({
        status: "error",
        message: `Database query failed: ${error.message}`,
        code: error.code,
        details: error.details,
        configured: false,
      });
    }

    return NextResponse.json({
      status: "healthy",
      message: "Database connection successful",
      creatorsCount: count,
      configured: true,
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      configured: false,
    });
  }
}
