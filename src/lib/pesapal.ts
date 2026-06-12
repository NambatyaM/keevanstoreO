// ============================================================
// Pesapal Payment Integration Module
// ============================================================

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_API_URL = process.env.PESAPAL_API_URL || "https://cybqa.pesapal.com/pesapalv3/api";

const isPesapalConfigured =
  PESAPAL_CONSUMER_KEY && PESAPAL_CONSUMER_KEY !== "mock" &&
  PESAPAL_CONSUMER_SECRET && PESAPAL_CONSUMER_SECRET !== "mock";

// Cache auth token
let authToken: string | null = null;
let authTokenExpiry = 0;

export interface PesapalAuthResponse {
  token: string;
  expiryDate: string;
  error?: string;
  status?: string;
}

export interface PesapalOrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: {
    email_address: string;
    phone_number: string;
    country_code: string;
    first_name: string;
    last_name: string;
    line_1: string;
    city: string;
    state: string;
    postal_code: string;
    zip_code: string;
  };
}

export interface PesapalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: string;
  status?: string;
}

export interface PesapalTransactionStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status: string;
  description: string;
  message: string;
  order_tracking_id: string;
  merchant_reference: string;
  error?: string;
  status?: string;
}

export async function authenticate(): Promise<string | null> {
  if (!isPesapalConfigured) {
    return "mock-pesapal-token";
  }

  // Return cached token if still valid
  if (authToken && Date.now() < authTokenExpiry) {
    return authToken;
  }

  try {
    const response = await fetch(`${PESAPAL_API_URL}/Auth/RequestToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    const data: PesapalAuthResponse = await response.json();

    if (data.token) {
      authToken = data.token;
      // Set expiry to 5 minutes before actual expiry
      const expiryMs = new Date(data.expiryDate).getTime() - 5 * 60 * 1000;
      authTokenExpiry = expiryMs;
      return authToken;
    }

    return null;
  } catch {
    console.error("Failed to authenticate with Pesapal");
    return null;
  }
}

export async function submitOrder(
  orderDetails: PesapalOrderRequest
): Promise<PesapalOrderResponse | null> {
  const token = await authenticate();

  if (!isPesapalConfigured) {
    // Mock response
    return {
      order_tracking_id: `mock-${Date.now()}`,
      merchant_reference: orderDetails.id,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard?payment=mock-success`,
    };
  }

  if (!token) return null;

  try {
    const response = await fetch(`${PESAPAL_API_URL}/Transactions/SubmitOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderDetails),
    });

    const data: PesapalOrderResponse = await response.json();
    return data;
  } catch {
    console.error("Failed to submit order to Pesapal");
    return null;
  }
}

export async function getTransactionStatus(
  orderTrackingId: string
): Promise<PesapalTransactionStatus | null> {
  const token = await authenticate();

  if (!isPesapalConfigured) {
    // Mock response
    return {
      payment_method: "Mobile Money",
      amount: 0,
      created_date: new Date().toISOString(),
      confirmation_code: `MOCK-${Date.now()}`,
      payment_status: "COMPLETED",
      description: "Mock payment completed",
      message: "Payment completed successfully",
      order_tracking_id: orderTrackingId,
      merchant_reference: `ref-${Date.now()}`,
    };
  }

  if (!token) return null;

  try {
    const response = await fetch(
      `${PESAPAL_API_URL}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data: PesapalTransactionStatus = await response.json();
    return data;
  } catch {
    console.error("Failed to get transaction status from Pesapal");
    return null;
  }
}

export function isPesapalReady(): boolean {
  return !!isPesapalConfigured;
}
