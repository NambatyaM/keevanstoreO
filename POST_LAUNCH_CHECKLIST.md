# ✅ Post-Launch Checklist

**Launch Date:** ___________  
**Deployed URL:** https://___________  
**Responsible Person:** ___________  

> This checklist ensures all critical systems are operational and verified after deployment to production.

---

## 🚀 Immediate Post-Launch (First 30 Minutes)

### Site Accessibility
- [ ] **Production URL responds:** `curl https://yourdomain.com` returns 200
- [ ] **HTTPS works:** No certificate warnings
- [ ] **Home page loads:** Renders without errors
- [ ] **Mobile responsive:** Looks good on iPhone/Android

**If ANY fail:**
- Check Vercel/Docker logs immediately
- Verify environment variables are set
- Test DATABASE_URL connection

---

### Authentication System
- [ ] **Signup page loads:** `/signup` accessible
- [ ] **Signup form works:** Create test account (email: test1@keevan.local, password: TestPass123!)
- [ ] **Validation works:** Submit empty form → shows error
- [ ] **Login works:** Login with created account
- [ ] **Logout works:** Click logout → redirected to home
- [ ] **Protected routes blocked:** Cannot access `/dashboard` without login

**If ANY fail:**
- Check Supabase auth status in Dashboard
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check middleware logs

---

### Database Verification
- [ ] **Supabase Dashboard loads:** Can access project
- [ ] **Tables exist:** Check `creators`, `products`, `orders` tables
- [ ] **Test account created:** Verify in `creators` table
- [ ] **Row Level Security enabled:** All tables show "RLS enabled" badge
- [ ] **Connections not maxed:** Connection pool < 80% used

**If ANY fail:**
- Run `bun prisma db push` again
- Check database URL format in Dashboard

---

## 💳 Payment Integration (Pesapal)

### Configuration
- [ ] **Pesapal API URL correct:** Check `PESAPAL_API_URL` in env
  - Sandbox: `https://cybqa.pesapal.com/pesapalv3/api`
  - Live: `https://pay.pesapal.com/v3/api`
- [ ] **Credentials valid:** Test API call with `curl` (command provided below)
- [ ] **IPN URL registered:** Go to Pesapal Dashboard → Settings → Add `https://yourdomain.com/api/pesapal/ipn`
- [ ] **IPN URL is HTTPS:** Must be public-facing HTTPS (not localhost/HTTP)
- [ ] **Mode is correct:** 
  - [ ] Sandbox if testing
  - [ ] Live if production (with approved merchant account)

**Test Pesapal Credentials:**
```bash
curl -X POST https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken \
  -H "Content-Type: application/json" \
  -d '{
    "consumer_key": "'$PESAPAL_CONSUMER_KEY'",
    "consumer_secret": "'$PESAPAL_CONSUMER_SECRET'"
  }'

# Expected response: {"token": "eyJ...", "expiryDate": "2024-..."}
# If error: Check credentials and IP whitelist in Pesapal
```

### Test Payment (Sandbox)
- [ ] **Create test product:** 
  - Title: "Test Product - 100 UGX"
  - Price: 100 UGX
  - Type: Digital (upload any file)
  - Status: Active
- [ ] **Complete mock checkout:**
  - Click "Buy Now" on product
  - Fill: email (test2@keevan.local), name (Test Buyer), method (MTN Money)
  - Submit checkout form
- [ ] **Pesapal page appears:** Redirected to payment gateway
- [ ] **Complete payment:**
  - Use Pesapal test credentials (available in sandbox dashboard)
  - Complete mock payment
- [ ] **Order status updated:**
  - Check Supabase → `orders` table
  - Order.status should be "completed" (not "pending")
- [ ] **Creator balance increased:**
  - Supabase → `creators` table
  - Original creator's balance should show 90 UGX earned (10% platform fee deducted)
- [ ] **Download link works:**
  - Buyer should receive download link
  - Can download file 5 times max before expiry

**IPN Webhook Verification:**
```bash
# Check if IPN was received (in logs)
# Vercel: Deployments → View Logs → Search "Pesapal IPN"
# Docker: docker logs [container-id] | grep "Pesapal IPN"

# Expected log: "Pesapal IPN received: {...}"
# If missing: IPN URL not registered or not accessible
```

**If payment fails:**
- Verify `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET` are correct
- Check `PESAPAL_IPN_URL` is accessible: `curl https://yourdomain.com/api/pesapal/ipn` (should return 405 or auth error, not 404)
- Enable debug logging in `/api/pesapal/ipn`

---

## 📁 File Storage (Cloudflare R2)

### R2 Bucket Setup
- [ ] **Bucket exists:** Check R2 Dashboard → Buckets
- [ ] **Bucket name is correct:** Should be `keevanstore` (or configured name)
- [ ] **Public access configured:**
  - [ ] Subdomain assigned (e.g., `keevanstore-[id].r2.cloudflarestorage.com`)
  - [ ] Public read enabled for `products/` folder
  - [ ] Private (no public access) for `uploads/` folder
- [ ] **API token valid:**
  - [ ] Credentials can be used to list bucket: 
    ```bash
    aws s3 ls s3://keevanstore --endpoint-url https://[ACCOUNT-ID].r2.cloudflarestorage.com
    ```

### Test File Upload
- [ ] **Upload test file:**
  - Dashboard → Create new product
  - Upload ZIP file (< 10MB for testing)
  - Save product
- [ ] **File appears in R2:** Check R2 Dashboard → Files
- [ ] **Download works:** 
  - Complete test payment (see above)
  - Download should generate presigned URL
  - File downloads successfully
- [ ] **File expires correctly:**
  - Download URL should expire after 15 minutes (preview) or 24 hours (purchase)

**If upload fails:**
- Check `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- Verify bucket permissions (should allow writes for your API token)
- Check browser console for CORS errors

---

## 📊 Analytics & Monitoring

### Dashboard Functionality
- [ ] **Analytics page loads:** `/dashboard/analytics` accessible
- [ ] **Charts render:** Revenue/sales charts visible
- [ ] **Page views tracked:** "Total Views" > 0
- [ ] **Sales stats accurate:** Matches completed orders

### Admin Panel
- [ ] **Admin can access:** Login as admin account
- [ ] **Creator list visible:** `/admin` shows all creators
- [ ] **Withdrawal queue visible:** Pending withdrawals listed
- [ ] **Admin can approve withdrawal:** Status changes to "paid"

---

## 🔐 Security Verification

### API Security
- [ ] **Rate limiting active:**
  - Make 15 requests to `/api/checkout` in 10 seconds
  - 11th+ request should return 429 Too Many Requests
- [ ] **Unauthenticated access blocked:**
  - Try accessing `/api/admin/creators` without login
  - Should return 403 Forbidden
- [ ] **CORS headers present:** Check response headers include security headers

**Test Rate Limiting:**
```bash
for i in {1..15}; do
  curl -X POST https://yourdomain.com/api/checkout \
    -H "Content-Type: application/json" \
    -d '{"productId":"test","buyerEmail":"test@test.com","buyerName":"Test","paymentMethod":"mtn_momo"}' &
done
wait

# Expect: First 10 return 200/400, 11th+ return 429
```

### HTTPS & Security Headers
- [ ] **SSL certificate valid:** No warnings
- [ ] **HSTS header present:** Check response headers
- [ ] **X-Content-Type-Options: nosniff:** Prevent MIME sniffing
- [ ] **X-Frame-Options: SAMEORIGIN:** Prevent clickjacking

```bash
curl -I https://yourdomain.com | grep -E "X-Content-Type|X-Frame|Strict-Transport"
```

---

## 📧 Email Notifications (If Configured)

- [ ] **Password reset email:** Test "Forgot password" → receives email
- [ ] **Order confirmation:** After payment → buyer receives email (if implemented)
- [ ] **Withdrawal notification:** Admin receives WhatsApp alert for payout requests

**If emails not working:**
- Check email provider configuration (SMTP settings)
- Currently: Likely logged to console (see logs for content)
- Recommended: Integrate SendGrid or Resend

---

## ⚡ Performance Baseline

Run these tests to establish performance baseline:

### Page Load Times
```bash
# Using curl timing
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# Check Vercel Analytics dashboard for:
# - LCP (Largest Contentful Paint) < 2.5s
# - FID (First Input Delay) < 100ms
# - CLS (Cumulative Layout Shift) < 0.1
```

### API Response Times
```bash
# Time API response
curl -w "Response time: %{time_total}s\n" \
  https://yourdomain.com/api/products?creator_id=test

# Expected: < 200ms for simple queries
```

### Database Query Performance
- [ ] **Check slow queries:**
  - Supabase Dashboard → Logs → API Overview
  - Look for queries > 1 second
  - Optimize if found

---

## 🌍 DNS & Domain Verification

### DNS Configuration
- [ ] **Domain points to app:**
  - `nslookup yourdomain.com` should resolve to Vercel/Docker IP
  - Or `CNAME` points to `cname.vercel-dns.com` (for Vercel)
- [ ] **Email records (optional):** 
  - `MX` records configured if using custom email
- [ ] **SPF/DKIM records (if needed):**
  - For email deliverability

### Subdomains (If Using)
- [ ] **API subdomain:** (if separate from main domain)
- [ ] **CDN subdomain:** (if using separate CDN)

---

## 📱 Mobile & Browser Testing

### Mobile Devices
- [ ] **iPhone (Safari):** Site loads, signup works, checkout completes
- [ ] **Android (Chrome):** Site loads, signup works, checkout completes
- [ ] **Tablet (iPad):** Responsive layout correct

### Browsers
- [ ] **Chrome (latest):** Full functionality
- [ ] **Firefox (latest):** Full functionality
- [ ] **Safari (latest):** Full functionality
- [ ] **Edge (latest):** Full functionality

---

## 🐛 Error Handling Verification

- [ ] **404 Page:** Visit `/nonexistent` → styled error page
- [ ] **500 Error:** Trigger error (e.g., bad payment) → user-friendly message
- [ ] **Network timeout:** Disable internet → graceful degradation
- [ ] **Form validation:** Submit invalid data → shows error

---

## 📝 Logging & Monitoring

- [ ] **Application logs accessible:**
  - Vercel: Deployments → View Logs
  - Docker: `docker logs [container-id]`
- [ ] **No error spam:** Logs show normal requests, not constant errors
- [ ] **Payment events logged:** Each order creates log entry
- [ ] **Admin dashboard shows errors:** Any failed operations are visible

**Set up log aggregation (Optional but Recommended):**
```bash
# Sentry (error tracking)
# Datadog (monitoring)
# LogRocket (session replay)
```

---

## 🚨 Emergency Procedures

### If Site Goes Down
1. [ ] Check Vercel/Docker status page
2. [ ] Check logs for errors
3. [ ] Restart application
4. [ ] Verify database connection
5. [ ] Check external services (Supabase, R2, Pesapal)
6. [ ] Escalate to DevOps if still failing

### If Payment System Fails
1. [ ] Check Pesapal API status
2. [ ] Verify `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET`
3. [ ] Check IPN URL is reachable
4. [ ] Switch to manual payment verification

### If Database Issues
1. [ ] Check Supabase status
2. [ ] Verify connection pool not exhausted
3. [ ] Check query performance in Supabase Dashboard
4. [ ] Scale database if needed

---

## ✍️ Sign-Off

- [ ] **All checks completed:** Date __________
- [ ] **Launch authorized by:** __________
- [ ] **Known issues documented:** (List any known issues below)

### Known Issues
```
Issue 1: [Description]
Workaround: [Solution]
ETA: [Fix date]

Issue 2: [Description]
Workaround: [Solution]
ETA: [Fix date]
```

### Post-Launch Improvements
```
[ ] Item 1: [Description] - Priority: [High/Medium/Low]
[ ] Item 2: [Description] - Priority: [High/Medium/Low]
[ ] Item 3: [Description] - Priority: [High/Medium/Low]
```

---

## 🎉 Launch Complete!

**Deployment Date:** __________  
**Launch Time:** __________  
**Team:** __________  

> Congratulations! Keevan Store v0.2.0 is now live in production.

**Next Meeting:** Scheduled for 24-hour post-launch review
**Monitoring Period:** First 7 days (increased alerting)
**Rollback Plan:** Keep previous version tagged in Docker/Git for 48 hours

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-17  
**Maintained By:** DevOps Team
