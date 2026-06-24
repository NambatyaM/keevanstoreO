// ============================================================
// POST /api/pesapal/initiate — Submit Order Request to Pesapal
// ============================================================
// 
// This endpoint initiates a payment with Pesapal.
// 
// Request body:
// {
//   amount: number,
//   currency: string (default: "UGX"),
//   description: string,
//   orderId: string (optional, will generate if not provided),
//   customerEmail: string,
//   customerPhone: string,
//   customerFirstName: string,
//   customerLastName: string
// }
//
// Response:
// {
//   success: true,
//   data: {
//     redirect_url: string,
//     order_tracking_id: string,
//     merchant_reference: string
//   }
// }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { submitOrderRequest, type PesapalOrderRequest } from "@/lib/pesapal";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = "UGX",
      description,
      orderId,
      customerEmail,
      customerPhone,
      customerFirstName,
      customerLastName,
      productId,
      creatorId,
    } = body;

    // Validate required fields
    if (!amount || !customerEmail || !customerPhone || !customerFirstName || !customerLastName) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: amount, customerEmail, customerPhone, customerFirstName, customerLastName" 
        },
        { status: 400 }
      );
    }

    if (!productId || !creatorId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: productId, creatorId" 
        },
        { status: 400 }
      );
    }

    const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL;
    if (!PESAPAL_CALLBACK_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: "PESAPAL_CALLBACK_URL environment variable is not set" 
        },
        { status: 500 }
      );
    }

    // Generate unique merchant reference (alphanumeric, max 50 chars)
    const merchantReference = orderId || `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Create Supabase client
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Calculate platform fee (10%)
    const platformFeePercent = 10;
    const platformFee = Math.round(amount * (platformFeePercent / 100));
    const creatorEarning = amount - platformFee;

    // Save order to Supabase with PENDING status BEFORE calling Pesapal
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        id: orderId || undefined,
        merchant_reference: merchantReference,
        amount: amount,
        currency: currency,
        platform_fee: platformFee,
        creator_earning: creatorEarning,
        status: "pending",
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_first_name: customerFirstName,
        customer_last_name: customerLastName,
        product_id: productId,
        creator_id: creatorId,
        description: description,
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to create order in database" },
        { status: 500 }
      );
    }

    // Submit order to Pesapal
    const pesapalOrder: PesapalOrderRequest = {
      id: merchantReference,
      currency: currency,
      amount: amount,
      description: description,
      callback_url: PESAPAL_CALLBACK_URL,
      notification_id: process.env.PESAPAL_IPN_ID || "",
      billing_address: {
        email_address: customerEmail,
        phone_number: customerPhone,
        country_code: "UG",
        first_name: customerFirstName,
        last_name: customerLastName,
      },
    };

    const pesapalResponse = await submitOrderRequest(pesapalOrder);

    // Update order with Pesapal tracking ID
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        pesapal_tracking_id: pesapalResponse.order_tracking_id,
        pesapal_merchant_reference: pesapalResponse.merchant_reference,
      })
      .eq("id", orderData.id);

    if (updateError) {
      console.error("Failed to update order with tracking ID:", updateError);
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      data: {
        redirect_url: pesapalResponse.redirect_url,
        order_tracking_id: pesapalResponse.order_tracking_id,
        merchant_reference: pesapalResponse.merchant_reference,
        order_id: orderData.id,
      },
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    
    // If Pesapal submission failed, try to mark the order as cancelled
    // This prevents broken orders from lingering in PENDING state
    if (body.orderId) {
      try {
        const supabase = createServiceRoleClient();
        if (supabase) {
          await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", body.orderId);
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup failed order:", cleanupError);
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to initiate payment" 
      },
      { status: 500 }
    );
  }
}
