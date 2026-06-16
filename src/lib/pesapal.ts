// ============================================================
// Pesapal Payment Integration Module
// ============================================================
// FIXED: Blueprint Issue B — Token cache and IPN ID moved to globalThis
// to survive Next.js hot-reloads and prevent thundering-herd token requests
// when multiple concurrent checkouts fire simultaneously.
// ============================================================

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_API_URL = process.env.PESAPAL_API_URL || "https://cybqa.pesapal.com/pesapalv3/api";

const isPesapalConfigured =
  PESAPAL_CONSUMER_KEY && PESAPAL_CONSUMER_KEY !== "mock" &&
  PESAPAL_CONSUMER_SECRET && PESAPAL_CONSUMER_SECRET !== "mock";

// ── Singleton cache on globalThis ────────────────────────────
// Prevents token thundering herd: only one token request in-flight at a time.
const _g = globalThis as typeof globalThis & {
  __pesapalAuthToken: string | null;
  __pesapalAuthTokenExpiry: number;
  __pesapalAuthInFlight: Promise<string | null> | null;
  __pesapalCachedIpnId: string | null;
  __pesapalCachedIpnUrl: string | null;
};

if (_g.__pesapalAuthToken === undefined) _g.__pesapalAuthToken = null;
if (_g.__pesapalAuthTokenExpiry === undefined) _g.__pesapalAuthTokenExpiry = 0;
if (_g.__pesapalAuthInFlight === undefined) _g.__pesapalAuthInFlight = null;
if (_g.__pesapalCachedIpnId === undefined) _g.__pesapalCachedIpnId = null;
if (_g.__pesapalCachedIpnUrl === undefined) _g.__pesapalCachedIpnUrl = null;

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
  if (_g.__pesapalAuthToken && Date.now() < _g.__pesapalAuthTokenExpiry) {
    return _g.__pesapalAuthToken;
  }

  // FIXED: Blueprint Issue B — if a token request is already in-flight,
  // wait for it instead of sending a duplicate request to Pesapal.
  if (_g.__pesapalAuthInFlight) {
    return _g.__pesapalAuthInFlight;
  }

  _g.__pesapalAuthInFlight = (async (): Promise<string | null> => {
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
        _g.__pesapalAuthToken = data.token;
        // Expire 5 minutes before actual expiry to avoid using a stale token
        _g.__pesapalAuthTokenExpiry = new Date(data.expiryDate).getTime() - 5 * 60 * 1000;
        return _g.__pesapalAuthToken;
      }

      return null;
    } catch {
      console.error("Failed to authenticate with Pesapal");
      return null;
    } finally {
      // Clear the in-flight promise so the next failure triggers a fresh attempt
      _g.__pesapalAuthInFlight = null;
    }
  })();

  return _g.__pesapalAuthInFlight;
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

export function isPesapalLive(): boolean {
  return process.env.PESAPAL_MODE === "live";
}

export async function registerIPN(ipnUrl: string): Promise<string | null> {
  // FIXED: Blueprint Issue B — IPN ID cached on globalThis singleton
  if (_g.__pesapalCachedIpnId && _g.__pesapalCachedIpnUrl === ipnUrl) {
    return _g.__pesapalCachedIpnId;
  }

  const token = await authenticate();
  if (!token) return null;

  // Mock mode: return a stable fake IPN ID
  if (!isPesapalConfigured) {
    _g.__pesapalCachedIpnId = "mock-ipn-id";
    _g.__pesapalCachedIpnUrl = ipnUrl;
    return _g.__pesapalCachedIpnId;
  }

  try {
    const response = await fetch(`${PESAPAL_API_URL}/URLSetup/RegisterIPN`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: "POST",
      }),
    });

    const data = await response.json();
    const ipnId = data.ipn_id || data.IPNId || null;

    if (ipnId) {
      _g.__pesapalCachedIpnId = ipnId;
      _g.__pesapalCachedIpnUrl = ipnUrl;
    }

    return ipnId;
  } catch {
    console.error("Failed to register IPN with Pesapal");
    return null;
  }
}
