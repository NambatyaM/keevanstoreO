# Pesapal API v3.0 Integration Setup Guide

This guide explains how to set up the rebuilt Pesapal payment integration for Keevan Store.

## What Was Rebuilt

The entire Pesapal integration has been rebuilt from scratch to follow the exact Pesapal API 3.0 specification:

- **`src/lib/pesapal.ts`** - Core library with token caching, IPN registration, order submission, and transaction status checking
- **`src/app/api/pesapal/register-ipn/route.ts`** - POST endpoint to register your IPN URL with Pesapal
- **`src/app/api/pesapal/initiate/route.ts`** - POST endpoint to initiate payments
- **`src/app/api/pesapal/callback/route.ts`** - GET endpoint for payment callback redirects
- **`src/app/api/pesapal/ipn/route.ts`** - GET/POST endpoint for IPN webhooks
- **`supabase/migrations/011_pesapal_ipn_logs.sql`** - Database migration for IPN logging and required order columns
- **`.env.example`** - Updated with new Pesapal environment variables

## Setup Steps

### 1. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Pesapal Payments (API v3.0)
PESAPAL_CONSUMER_KEY=your-pesapal-consumer-key
PESAPAL_CONSUMER_SECRET=your-pesapal-consumer-secret
PESAPAL_IPN_ID=your-pesapal-ipn-id  # Get this from step 2
PESAPAL_IPN_URL=https://yourdomain.com/api/pesapal/ipn
PESAPAL_CALLBACK_URL=https://yourdomain.com/api/pesapal/callback
PESAPAL_ENV=sandbox  # Change to "live" for production
```

**For Sandbox Testing:**
Get demo credentials from: https://developer.pesapal.com/api3-demo-keys.txt

### 2. Register IPN URL

Run this command **once** to register your IPN URL with Pesapal:

```bash
curl -X POST http://localhost:3000/api/pesapal/register-ipn
```

The response will include an `ipn_id`. Copy this value and add it to your `.env.local` as `PESAPAL_IPN_ID`.

**Important:** This step must be completed before any orders can be submitted.

### 3. Apply Database Migration

Run the migration to add the IPN logs table and required columns to the orders table:

```bash
supabase db push
```

Or manually execute `supabase/migrations/011_pesapal_ipn_logs.sql` in the Supabase SQL Editor.

### 4. Test the Integration

**Test Payment Flow:**

1. On your frontend, call `/api/pesapal/initiate` with:
   ```json
   {
     "amount": 5000,
     "currency": "UGX",
     "description": "Test Product",
     "customerEmail": "test@example.com",
     "customerPhone": "256700000000",
     "customerFirstName": "John",
     "customerLastName": "Doe",
     "productId": "your-product-id",
     "creatorId": "your-creator-id"
   }
   ```

2. You'll receive a `redirect_url`. Redirect the user to this URL (or open in an iframe).

3. Complete the test payment in the Pesapal sandbox.

4. Pesapal will redirect to your callback URL, which will update the order status.

5. The IPN webhook will also fire in the background to confirm the payment.

### 5. Switch to Production

When ready for production:

1. Change `PESAPAL_ENV=live` in your `.env.local`
2. Use your live Pesapal consumer key and secret
3. Update `PESAPAL_IPN_URL` and `PESAPAL_CALLBACK_URL` to your production domain
4. Re-run the IPN registration step to get a production IPN ID

## API Endpoints

### POST /api/pesapal/register-ipn
Registers your IPN URL with Pesapal. Run once during setup.

### POST /api/pesapal/initiate
Initiates a payment request. Returns a redirect URL to Pesapal's payment page.

**Request Body:**
```json
{
  "amount": 5000,
  "currency": "UGX",
  "description": "Product description",
  "customerEmail": "customer@example.com",
  "customerPhone": "256700000000",
  "customerFirstName": "John",
  "customerLastName": "Doe",
  "productId": "uuid",
  "creatorId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://...",
    "order_tracking_id": "...",
    "merchant_reference": "...",
    "order_id": "uuid"
  }
}
```

### GET /api/pesapal/callback
Handles the redirect after payment. Updates order status and redirects user to order status page.

**Query Params:**
- `OrderTrackingId`
- `OrderMerchantReference`
- `OrderNotificationType`

### GET/POST /api/pesapal/ipn
Handles IPN webhooks from Pesapal. Updates order status and triggers delivery logic.

**Params (GET query or POST body):**
- `OrderTrackingId`
- `OrderMerchantReference`
- `OrderNotificationType`

## Database Schema

### orders table (new columns)
- `merchant_reference` (TEXT, UNIQUE) - Your internal ID sent to Pesapal
- `pesapal_tracking_id` (TEXT) - Returned by Pesapal after order submission
- `pesapal_merchant_reference` (TEXT) - Pesapal's reference
- `pesapal_transaction_id` (TEXT) - Confirmation code from Pesapal
- `pesapal_payment_method` (TEXT) - Payment method used
- `customer_phone` (TEXT)
- `customer_first_name` (TEXT)
- `customer_last_name` (TEXT)
- `description` (TEXT)

### pesapal_ipn_logs table (new)
- `id` (UUID, PRIMARY KEY)
- `order_tracking_id` (TEXT)
- `merchant_reference` (TEXT)
- `raw_status` (TEXT)
- `received_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

## Security Notes

- All Pesapal API calls happen server-side only (Next.js API routes)
- Credentials are never exposed to the frontend
- Token is cached in-memory with 4.5-minute expiry (Pesapal tokens are valid for 5 minutes)
- IPN handler includes idempotency checks to prevent duplicate processing
- Order status is only updated after verifying with `GetTransactionStatus` API

## Troubleshooting

**"IPN ID not configured" error:**
- Run `POST /api/pesapal/register-ipn` to get your IPN ID
- Add it to `.env.local` as `PESAPAL_IPN_ID`

**"Pesapal is not configured" error:**
- Ensure `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET` are set in `.env.local`

**Payment not completing:**
- Check the `pesapal_ipn_logs` table for IPN events
- Verify the order status in the `orders` table
- Check server logs for errors

**Images not loading after payment:**
- Ensure R2 bucket has public access enabled (see `R2_BUCKET_SETUP.md`)

## Reference

- Pesapal API v3.0 Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
- Demo Credentials: https://developer.pesapal.com/api3-demo-keys.txt
