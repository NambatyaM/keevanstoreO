# Task 5: Wire Keevan Store to Real Supabase, R2, and Pesapal (LIVE)

## Agent: Main

## Summary
Wired all API routes and auth flow to use real Supabase queries when `isUsingMockData()` returns `false`. All mock fallbacks remain intact as safety net.

## Files Created
- `src/lib/db-mappers.ts` — Mapping functions for all DB types (snake_case ↔ camelCase)

## Files Modified
- `src/lib/supabase/server.ts` — Added `createServiceRoleClient()` for admin/webhook operations
- `src/lib/pesapal.ts` — Added `registerIPN()` and `isPesapalLive()` functions
- `src/app/api/auth/login/route.ts` — Real Supabase `signInWithPassword()` + session check
- `src/app/api/auth/signup/route.ts` — Real Supabase `signUp()` + creator profile creation via service role
- `src/app/api/auth/logout/route.ts` — Real Supabase `signOut()`
- `src/app/api/store/route.ts` — Real Supabase queries for store data + update with auth verification
- `src/app/api/products/route.ts` — Real Supabase CRUD with auth and ownership checks
- `src/app/api/products/[id]/route.ts` — Real Supabase get/update/delete with ownership verification
- `src/app/api/checkout/route.ts` — Real order creation + Pesapal IPN registration + live submitOrder
- `src/app/api/pesapal/ipn/route.ts` — Full IPN processing with idempotency, balance updates
- `src/app/api/pesapal/callback/route.ts` — Real Supabase order lookup + status-based redirect
- `src/app/api/orders/route.ts` — Real Supabase queries with auth + Pesapal flow
- `src/app/api/orders/[id]/route.ts` — Real Supabase query with ownership check
- `src/app/api/donations/route.ts` — Real Supabase queries + service role donation processing
- `src/app/api/withdrawals/route.ts` — Real Supabase queries with auth + balance validation
- `src/app/api/analytics/route.ts` — Real Supabase analytics with date range + period-over-period calculations
- `src/app/api/admin/creators/route.ts` — Service role client for listing + updating creators
- `src/app/api/admin/withdrawals/route.ts` — Service role client for listing + approving/rejecting withdrawals
- `src/app/api/page-views/route.ts` — Real Supabase insert + creator total_views increment
- `worklog.md` — Updated with Task 5 details

## Key Architecture Decisions
1. **Service Role Client**: Used for operations that bypass RLS (signup creator profile creation, IPN processing, admin operations, page view inserts, analytics)
2. **DB Mappers**: Centralized snake_case ↔ camelCase mapping in `src/lib/db-mappers.ts` to avoid repetition and ensure consistency
3. **Auth Cookie**: `keevan-auth` cookie is set in both mock and real modes for middleware compatibility
4. **IPN Registration**: Pesapal IPN URL is registered dynamically before each order submission
5. **Idempotency**: IPN handler checks if order is already completed before processing

## Verification
- `bun run lint` passes with zero errors
- Dev server compiles successfully
- Real API endpoints return expected responses (404 for non-existent stores, "not authenticated" for unauthenticated requests, "available: true" for username checks)
