# Vercel Environment Variables Checklist

This checklist contains all environment variables that must be set in your Vercel project settings (Settings > Environment Variables) for production deployment.

## Required Variables (Production)

### Database
- **DATABASE_URL** - PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database`)
  - Get this from your Supabase project settings > Database > Connection String

### Supabase
- **NEXT_PUBLIC_SUPABASE_URL** - Supabase project URL (e.g., `https://xxx.supabase.co`)
  - Get this from your Supabase project settings > API
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Supabase anonymous/public key
  - Get this from your Supabase project settings > API
- **SUPABASE_SERVICE_ROLE_KEY** - Supabase service role key (server-side only)
  - Get this from your Supabase project settings > API
  - ⚠️ **IMPORTANT**: This is a secret - do NOT add NEXT_PUBLIC_ prefix

### Application
- **NEXT_PUBLIC_APP_URL** - Your production URL (e.g., `https://www.keevanstore.in`)
  - Set this to your actual production domain

### Cloudflare R2 Storage (Required in production for file uploads)
- **R2_ACCOUNT_ID** - Cloudflare R2 account ID
- **R2_ACCESS_KEY_ID** - R2 access key ID
- **R2_SECRET_ACCESS_KEY** - R2 secret access key
- **R2_BUCKET_NAME** - R2 bucket name (e.g., `keevanstore`)
  - ⚠️ **IMPORTANT**: All R2 variables are secrets - do NOT add NEXT_PUBLIC_ prefix

### Pesapal Payment Gateway (Optional - payments will fail without it)
- **PESAPAL_CONSUMER_KEY** - Pesapal consumer key
- **PESAPAL_CONSUMER_SECRET** - Pesapal consumer secret
- **PESAPAL_API_URL** - Pesapal API URL (default: `https://cybqa.pesapal.com/pesapalv3/api` for sandbox)
- **PESAPAL_MODE** - Set to `live` for production, `sandbox` or omit for test mode
- **PESAPAL_IPN_URL** - Your production IPN webhook URL (e.g., `https://www.keevanstore.in/api/pesapal/ipn`)
  - ⚠️ **IMPORTANT**: This MUST be set to your production URL, NOT localhost
  - ⚠️ **IMPORTANT**: All Pesapal variables are secrets - do NOT add NEXT_PUBLIC_ prefix

### WhatsApp Notifications (Optional)
- **WHATSAPP_PHONE_NUMBER** - Admin WhatsApp phone number for withdrawal notifications
- **WHATSAPP_API_KEY** - WhatsApp API key (if using a WhatsApp API service)
  - ⚠️ **IMPORTANT**: These are secrets - do NOT add NEXT_PUBLIC_ prefix

## Environment-Specific Settings

### Development (Local)
- Set `DATABASE_URL` to your local PostgreSQL or use Supabase dev database
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Supabase project
- Set R2 and Pesapal variables to `mock` to use mock mode for testing
- Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`

### Production (Vercel)
- All required variables must be set in Vercel project settings
- Use production Supabase credentials
- Use production R2 credentials (required for file uploads)
- Use production Pesapal credentials (required for payments)
- Set `NEXT_PUBLIC_APP_URL` to `https://www.keevanstore.in`
- Set `PESAPAL_IPN_URL` to `https://www.keevanstore.in/api/pesapal/ipn`
- Set `PESAPAL_MODE` to `live` for production payments

## Security Notes

1. **NEVER** expose secrets in client-side code
2. **NEVER** add `NEXT_PUBLIC_` prefix to secrets (service role keys, API keys, etc.)
3. Only `NEXT_PUBLIC_` variables are exposed to the browser
4. Service role keys should only be used in server-side code (API routes, server components)
5. Rotate secrets regularly
6. Use Vercel's environment variable protection features

## Verification Steps

Before deploying to production:

1. ✅ Verify all required variables are set in Vercel
2. ✅ Verify `NEXT_PUBLIC_APP_URL` is set to production domain
3. ✅ Verify `PESAPAL_IPN_URL` is set to production webhook URL
4. ✅ Verify no secrets have `NEXT_PUBLIC_` prefix
5. ✅ Verify `PESAPAL_MODE` is set to `live` for production
6. ✅ Test the application in preview environment first
7. ✅ Verify R2 CORS configuration allows your production domain
8. ✅ Verify Pesapal IPN is registered with production URL

## Common Issues

### Uploads failing
- Check R2 credentials are set correctly
- Check R2 bucket CORS configuration
- Check file size limits (4MB for Vercel free tier)

### Payments failing
- Check Pesapal credentials are correct for the environment (sandbox vs live)
- Check `PESAPAL_IPN_URL` is set to production URL
- Verify IPN is registered with Pesapal

### Authentication failing
- Check Supabase credentials are correct
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check `SUPABASE_SERVICE_ROLE_KEY` is set (for server-side operations)
