// ============================================================
// POST /api/pesapal/register-ipn — Register IPN URL with Pesapal
// ============================================================
// 
// IMPORTANT: This route must be called manually once during setup.
// After calling this route, copy the returned ipn_id and add it to your
// .env.local file as PESAPAL_IPN_ID before any orders can be submitted.
//
// Usage: 
//   curl -X POST http://localhost:3000/api/pesapal/register-ipn
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { registerIPN } from "@/lib/pesapal";

export async function POST(request: NextRequest) {
  try {
    const PESAPAL_IPN_URL = process.env.PESAPAL_IPN_URL;
    
    if (!PESAPAL_IPN_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: "PESAPAL_IPN_URL environment variable is not set. Please add it to your .env.local file." 
        },
        { status: 400 }
      );
    }

    // Register the IPN URL with Pesapal
    const ipnId = await registerIPN(PESAPAL_IPN_URL);

    // Log the IPN ID to console for easy copying
    console.log("=".repeat(60));
    console.log("PESAPAL IPN REGISTRATION SUCCESSFUL");
    console.log("=".repeat(60));
    console.log(`IPN ID: ${ipnId}`);
    console.log(`IPN URL: ${PESAPAL_IPN_URL}`);
    console.log("=".repeat(60));
    console.log("NEXT STEP: Add the following to your .env.local file:");
    console.log(`PESAPAL_IPN_ID=${ipnId}`);
    console.log("=".repeat(60));

    return NextResponse.json({
      success: true,
      data: {
        ipn_id: ipnId,
        url: PESAPAL_IPN_URL,
        message: "IPN registered successfully. Please add the ipn_id to your environment variables as PESAPAL_IPN_ID.",
      },
    });
  } catch (error) {
    console.error("Error registering IPN:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to register IPN with Pesapal" 
      },
      { status: 500 }
    );
  }
}
