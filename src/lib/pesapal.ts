// ============================================================
// Pesapal Payment Integration Module - API v3.0
// ============================================================
// Rebuilt to follow exact Pesapal API 3.0 specification
// Reference: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
// ============================================================

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID;
const PESAPAL_IPN_URL = process.env.PESAPAL_IPN_URL;
const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL;
const PESAPAL_ENV = process.env.PESAPAL_ENV || "sandbox";

// Base URLs
const PESAPAL_BASE_URLS = {
  sandbox: "https://cybqa.pesapal.com/pesapalv3",
  live: "https://pay.pesapal.com/v3",
};

const PESAPAL_API_URL = PESAPAL_BASE_URLS[PESAPAL_ENV as keyof typeof PESAPAL_BASE_URLS] || PESAPAL_BASE_URLS.sandbox;

const isPesapalConfigured =
  PESAPAL_CONSUMER_KEY && PESAPAL_CONSUMER_KEY !== "mock" &&
  PESAPAL_CONSUMER_SECRET && PESAPAL_CONSUMER_SECRET !== "mock";

// ── Singleton cache on globalThis ────────────────────────────
// Prevents token thundering herd: only one token request in-flight at a time.
const _g = globalThis as typeof globalThis & {
  __pesapalAuthToken: string | null;
  __pesapalAuthTokenExpiry: number;
  __pesapalAuthInFlight: Promise<string | null> | null;
};

if (_g.__pesapalAuthToken === undefined) _g.__pesapalAuthToken = null;
if (_g.__pesapalAuthTokenExpiry === undefined) _g.__pesapalAuthTokenExpiry = 0;
if (_g.__pesapalAuthInFlight === undefined) _g.__pesapalAuthInFlight = null;

// ============================================================
// Types
// ============================================================

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
  payment_status_description: string;
  description: string;
  message: string;
  order_tracking_id: string;
  merchant_reference: string;
  error?: string;
  status?: string;
}

export interface PesapalIPNRegistrationRequest {
  url: string;
  ipn_notification_type: string;
}

export interface PesapalIPNRegistrationResponse {
  ipn_id: string;
  url: string;
  error?: string;
  status?: string;
}

// ============================================================
// STEP 1 — Authentication (Get Bearer Token)
// ============================================================

export async function getPesapalToken(): Promise<string> {
  if (!isPesapalConfigured) {
    throw new Error("Pesapal is not configured. Please set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET environment variables.");
  }

  // Return cached token if still valid (token is valid for 5 minutes)
  if (_g.__pesapalAuthToken && Date.now() < _g.__pesapalAuthTokenExpiry) {
    return _g.__pesapalAuthToken;
  }

  // If a token request is already in-flight, wait for it
  if (_g.__pesapalAuthInFlight) {
    return _g.__pesapalAuthInFlight;
  }

  _g.__pesapalAuthInFlight = (async (): Promise<string> => {
    try {
      const response = await fetch(`${PESAPAL_API_URL}/api/Auth/RequestToken`, {
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

      if (data.error) {
        throw new Error(`Pesapal authentication failed: ${data.error}`);
      }

      if (!data.token) {
        throw new Error("Pesapal authentication failed: No token received");
      }

      _g.__pesapalAuthToken = data.token;
      // Token is valid for 5 minutes - set expiry to 4.5 minutes to be safe
      _g.__pesapalAuthTokenExpiry = Date.now() + 4.5 * 60 * 1000;
      
      return _g.__pesapalAuthToken;
    } catch (error) {
      throw new Error(`Failed to authenticate with Pesapal: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      _g.__pesapalAuthInFlight = null;
    }
  })();

  return _g.__pesapalAuthInFlight;
}

// ============================================================
// STEP 2 — Register IPN URL
// ============================================================

export async function registerIPN(ipnUrl: string): Promise<string> {
  const token = await getPesapalToken();

  try {
    const response = await fetch(`${PESAPAL_API_URL}/api/Transactions/RegisterIpnUrl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: "GET",
      } as PesapalIPNRegistrationRequest),
    });

    const data: PesapalIPNRegistrationResponse = await response.json();

    if (data.error) {
      throw new Error(`Failed to register IPN: ${data.error}`);
    }

    if (!data.ipn_id) {
      throw new Error("Failed to register IPN: No IPN ID received");
    }

    return data.ipn_id;
  } catch (error) {
    throw new Error(`Failed to register IPN with Pesapal: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================
// STEP 3 — Submit Order Request (Initiate Payment)
// ============================================================

export async function submitOrderRequest(
  orderDetails: PesapalOrderRequest
): Promise<PesapalOrderResponse> {
  // Validate that IPN ID is configured
  if (!PESAPAL_IPN_ID) {
    throw new Error(
      "IPN ID not configured. Register your IPN URL first using /api/pesapal/register-ipn and set PESAPAL_IPN_ID in your environment variables."
    );
  }

  const token = await getPesapalToken();

  try {
    const response = await fetch(`${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderDetails),
    });

    const data: PesapalOrderResponse = await response.json();

    if (data.error) {
      throw new Error(`Failed to submit order: ${data.error}`);
    }

    if (!data.order_tracking_id || !data.redirect_url) {
      throw new Error("Failed to submit order: Invalid response from Pesapal");
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to submit order to Pesapal: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================
// STEP 5 — Get Transaction Status
// ============================================================

export async function getTransactionStatus(
  orderTrackingId: string
): Promise<PesapalTransactionStatus> {
  const token = await getPesapalToken();

  try {
    const response = await fetch(
      `${PESAPAL_API_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data: PesapalTransactionStatus = await response.json();

    if (data.error) {
      throw new Error(`Failed to get transaction status: ${data.error}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to get transaction status from Pesapal: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================
// Helper Functions
// ============================================================

export function isPesapalReady(): boolean {
  return !!isPesapalConfigured;
}

export function isPesapalLive(): boolean {
  return PESAPAL_ENV === "live";
}

export function getPesapalEnv(): string {
  return PESAPAL_ENV;
}
