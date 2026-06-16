# 🚀 Keevan Store v0.2.0 — Deployment Guide

**Status:** Production-Ready  
**Last Updated:** 2026-06-17  
**Deployment Target:** Vercel (Recommended) / Docker / Self-Hosted

---

## 📋 Table of Contents
1. System Requirements
2. Pre-Deployment Checklist
3. Environment Variables
4. Database Setup
5. Deployment Instructions (by platform)
6. Post-Deployment Verification
7. Troubleshooting

---

## 🖥️ System Requirements

### Recommended Stack
| Component | Version | Purpose |
|-----------|---------|---------|
| **Runtime** | Bun 1.1.0+ | JavaScript runtime (faster than Node.js) |
| **Framework** | Next.js 15.3.4 | React SSR framework |
| **Database** | PostgreSQL 14+ | Via Supabase |
| **Storage** | Cloudflare R2 | S3-compatible object storage |
| **Node** | 18.0+ or Bun 1.1+ | For build tools |

### Alternative: Deploy Anywhere
- **Vercel:** Recommended (Next.js native, serverless)
- **Docker:** Self-hosted (on Render, Railway, Digital Ocean, AWS)
- **Node.js:** Can use Node.js instead of Bun (slower builds)

---

## ✅ Pre-Deployment Checklist

**Before proceeding, ensure:**

- [ ] All credentials have been rotated (see critical security note below)
- [ ] `.env` file removed from git history
- [ ] Supabase project created and PostgreSQL configured
- [ ] Cloudflare R2 bucket created (public + private zones)
- [ ] Pesapal sandbox/live account configured
- [ ] Domain purchased and DNS configured (if self-hosted)
- [ ] SSL certificate ready (automatically handled by Vercel)

---

## 🔐 Environment Variables

### Critical Security Note
⚠️ **DO NOT commit `.env` files to Git**

All variables listed below must be added via:
- **Vercel:** Settings → Environment Variables
- **Docker:** `.env.local` file (add to `.gitignore`)
- **Self-hosted:** System environment variables or `.env` (add to `.gitignore`)

### Complete Environment Variable List

#### Database (Supabase PostgreSQL)
```bash
# PostgreSQL connection string with connection pooling
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-ID].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Format breakdown:
# postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?pgbouncer=true&connection_limit=1
# - User: postgres (default)
# - Password: [Your Supabase password]
# - Host: [Your-Project-ID].pooler.supabase.com
# - Port: 6543 (pooler port)
# - Database: postgres
# - Connection pooling: Required for serverless
```

#### Supabase Authentication
```bash
# From Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[PUBLIC-ANON-KEY]  # 64-char JWT key

# From Supabase Dashboard → Project Settings → Service Role Secret
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]  # 64-char JWT key (KEEP SECRET)

# Note: NEXT_PUBLIC_* variables are safe to expose (anonkey has RLS limits)
# SUPABASE_SERVICE_ROLE_KEY must stay private (server-only)
```

#### Cloudflare R2 File Storage
```bash
# From Cloudflare Dashboard → R2 → Account Details
R2_ACCOUNT_ID=[YOUR-ACCOUNT-ID]  # e.g., a1b2c3d4e5f6g7h8...

# From Cloudflare Dashboard → R2 → Settings → API Tokens
R2_ACCESS_KEY_ID=[YOUR-ACCESS-KEY]        # e.g., 1234567890abcdef
R2_SECRET_ACCESS_KEY=[YOUR-SECRET-KEY]    # Keep this secret!

# Bucket name (lowercase, no special chars)
R2_BUCKET_NAME=keevanstore

# Access URL (optional, auto-generated but can be customized)
# Pattern: https://[BUCKET-NAME].[ACCOUNT-ID].r2.cloudflarestorage.com
```

#### Pesapal Payment Gateway
```bash
# From Pesapal Dashboard → Settings → API
# Choose SANDBOX for testing, LIVE for production

# Testing (Sandbox)
PESAPAL_CONSUMER_KEY=sandbox_key_...
PESAPAL_CONSUMER_SECRET=sandbox_secret_...
PESAPAL_API_URL=https://cybqa.pesapal.com/pesapalv3/api
PESAPAL_MODE=sandbox

# Production (Live)
PESAPAL_CONSUMER_KEY=prod_key_...
PESAPAL_CONSUMER_SECRET=prod_secret_...
PESAPAL_API_URL=https://pay.pesapal.com/v3/api
PESAPAL_MODE=live

# IPN Webhook URL (MUST be public HTTPS)
# This URL must be registered in Pesapal Dashboard
# After each deployment, verify this URL in Pesapal settings
PESAPAL_IPN_URL=https://yourdomain.com/api/pesapal/ipn

# Note: If PESAPAL_MODE=sandbox, Pesapal ignores PESAPAL_IPN_URL
# In production, register the URL in Pesapal Dashboard manually
```

#### Application Configuration
```bash
# Your app's public URL (used for redirects, emails, social links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # No trailing slash

# WhatsApp Support Number (for admin notifications)
# Format: CountryCode + Number (e.g., 256768345905 for Uganda)
ADMIN_WHATSAPP_NUMBER=256768345905  # Optional, used for notifications

# Next.js Build Optimization (optional)
# Disable if you hit build memory limits on small servers
SKIP_ENV_VALIDATION=false
```

### How to Generate Secure Secrets

#### Generate Random Secrets (for local development / testing)
```bash
# OpenSSL method
openssl rand -base64 32

# Node.js method
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Bash method (Linux/Mac)
head -c 32 /dev/urandom | base64
```

#### Get Real Credentials

**Supabase:**
1. Go to https://supabase.com → Create Project
2. Settings → API → Copy `URL` and `anon public key`
3. Settings → Database → Copy connection string

**Cloudflare R2:**
1. Go to https://dash.cloudflare.com → R2
2. Create bucket (e.g., `keevanstore`)
3. R2 → Settings → API Tokens → Create API Token
4. Copy Account ID from Overview

**Pesapal:**
1. Go to https://developer.pesapal.com
2. Create sandbox account for testing
3. Dashboard → API Keys → Copy consumer key + secret

---

## 🛢️ Database Setup Instructions

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. **Settings:**
   - Project Name: `keevanstore`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users (default: US East)
4. Wait for project to initialize (~2-3 minutes)

### Step 2: Push Prisma Schema to Database

**Option A: Using Bun CLI (Recommended)**
```bash
# Install dependencies
bun install

# Set DATABASE_URL in .env.local
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-ID].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Push schema to database
bun prisma db push

# Verify schema
bun prisma studio  # Opens visual DB browser at http://localhost:5555
```

**Option B: Using Supabase Dashboard SQL Editor**

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of `prisma/migrations/migration_lock.toml` and latest migration file
4. Paste into SQL Editor and execute

### Step 3: Enable Row Level Security (RLS)

RLS is **critical for multi-tenant security**. Each creator can only see their own data.

```sql
-- Supabase Dashboard → SQL Editor
-- Run this after schema creation:

-- Enable RLS on all tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_sessions ENABLE ROW LEVEL SECURITY;
-- ... and so on for all tables

-- Example: Creators can only view their own profile
CREATE POLICY "Creators view own profile"
  ON creators FOR SELECT
  USING (auth.uid() = id);

-- Example: Products are public (viewable by anyone)
CREATE POLICY "Products are public"
  ON products FOR SELECT
  USING (true);
```

### Step 4: Verify Database Connection

```bash
# Test connection
bun prisma migrate status

# Expected output:
# 1 migration already applied on database: 20240610_initial

# If it fails:
# - Check DATABASE_URL is correct
# - Verify firewall allows your IP
# - Try Supabase Dashboard → Authentication → Database Access
```

---

## 🚀 Deployment Instructions

### Option 1: Vercel (Recommended - 5 minutes)

**Vercel is ideal because:**
- ✅ Next.js native (zero configuration)
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Free tier available

#### Steps:

1. **Push code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/keevanstore.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Import GitHub repo
   - Select `keevanstore` repository

3. **Configure Build Settings**
   - **Framework Preset:** Next.js
   - **Build Command:** `bun run build`
   - **Output Directory:** `.next`
   - **Install Command:** `bun install` (if prompted)

4. **Set Environment Variables** (in Vercel Dashboard)
   - Go to Settings → Environment Variables
   - Add all variables from above (Database, Supabase, R2, Pesapal)
   - Make sure to set them for **Production**, **Preview**, and **Development** if needed

5. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes
   - Visit your deployed site at `https://keevanstore-[hash].vercel.app` or custom domain

#### Connect Custom Domain

1. Go to Settings → Domains
2. Add your domain (e.g., `keevanstore.in`)
3. Update DNS records in your domain registrar:
   - Type: `CNAME`
   - Name: `@` or your subdomain
   - Value: `cname.vercel-dns.com`
4. Vercel auto-provisions SSL within 48 hours

---

### Option 2: Docker (Self-Hosted)

**Use Docker if you want:**
- Full control over server
- Custom infrastructure
- No Vercel lock-in

#### Create Dockerfile (Already in repo if using it)

```dockerfile
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy app code
COPY . .

# Generate Prisma client
RUN bun prisma generate

# Build Next.js
RUN bun run build

# Expose port
EXPOSE 3000

# Start app
CMD ["bun", "run", "start"]
```

#### Build and Run Locally

```bash
# Build Docker image
docker build -t keevanstore:latest .

# Run container with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXT_PUBLIC_SUPABASE_URL="..." \
  -e SUPABASE_SERVICE_ROLE_KEY="..." \
  -e R2_ACCOUNT_ID="..." \
  -e R2_ACCESS_KEY_ID="..." \
  -e R2_SECRET_ACCESS_KEY="..." \
  -e R2_BUCKET_NAME="keevanstore" \
  -e PESAPAL_CONSUMER_KEY="..." \
  -e PESAPAL_CONSUMER_SECRET="..." \
  -e PESAPAL_IPN_URL="https://yourdomain.com/api/pesapal/ipn" \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  keevanstore:latest

# Visit http://localhost:3000
```

#### Deploy to Cloud Provider

**Railway (Easiest):**
```bash
npm install -g railway
railway link  # Connect your Docker image
railway up    # Deploy
```

**DigitalOcean / AWS / Google Cloud:**
See provider-specific Docker deployment guides (they all follow similar steps).

---

### Option 3: Node.js (If Bun unavailable)

If your server doesn't support Bun:

```bash
# Install Node.js 18+
node --version  # Should be 18.0+

# Install dependencies with npm
npm install

# Build
npm run build

# Start
npm run start

# Visit http://localhost:3000
```

---

## ✅ Post-Deployment Verification

### Immediate Checks (First 10 minutes)

1. **Site is accessible**
   ```bash
   curl https://yourdomain.com
   # Should return HTML (not 502/503)
   ```

2. **Authentication works**
   - Visit `/signup` → Create test account
   - Verify email/password validation
   - Check middleware redirects to login if not authenticated

3. **Database connected**
   - Create product → Verify in Supabase Dashboard
   - Check `products` table has new record

4. **R2 storage working**
   - Upload a product file
   - Verify file appears in R2 Dashboard

5. **Rate limiting active**
   - Make 15 checkout attempts in 60 seconds
   - Verify 11th+ attempt gets 429 Too Many Requests

### Pesapal Integration Verification

1. **Register IPN URL in Pesapal Dashboard**
   ```
   Go to Pesapal Dashboard → Settings → URLs
   Add Notification URL: https://yourdomain.com/api/pesapal/ipn
   ```

2. **Test payment (sandbox)**
   ```bash
   1. Create test product (100 UGX)
   2. Click "Buy Now"
   3. Fill form: test@example.com, Test User, MTN Money
   4. Enter test Pesapal credentials (Pesapal provides test numbers)
   5. Verify order status changes to "completed"
   6. Check creator balance increased
   ```

3. **Monitor IPN logs**
   ```bash
   # In Vercel: Deployments → View Logs
   # In Docker: docker logs [container-id]
   # Check for: "Pesapal IPN received"
   ```

---

## 🔍 Troubleshooting

### Build Fails with "Memory Exceeded"

**Cause:** Prisma type generation is memory-intensive

**Solution:**
```bash
# Reduce build resources
export NODE_OPTIONS="--max-old-space-size=1024"

# Or use Node.js instead of Bun
npm install
npm run build
```

### 502 Bad Gateway

**Cause:** App crashed after deployment

**Solution:**
```bash
# Check logs
# Vercel: Deployments → View Logs
# Docker: docker logs [container-id]

# Common issues:
# - Missing environment variable
# - DATABASE_URL incorrect
# - Prisma client not generated (run: bun prisma generate)
```

### Database Connection Timeout

**Cause:** Firewall blocking connections

**Solution:**
```bash
# 1. Add your IP to Supabase whitelist
#    Supabase Dashboard → Settings → Database → IP Whitelist

# 2. Test connection
bun prisma db execute --stdin < /dev/null

# 3. Verify DATABASE_URL format:
#    postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/postgres?pgbouncer=true
```

### Pesapal Payments Not Working

**Cause:** IPN URL not registered or credentials wrong

**Solution:**
```bash
# 1. Verify IPN URL in Pesapal Dashboard
#    Must match: https://yourdomain.com/api/pesapal/ipn

# 2. Check credentials
echo $PESAPAL_CONSUMER_KEY
echo $PESAPAL_CONSUMER_SECRET

# 3. Test payment in sandbox first
#    PESAPAL_MODE should be "sandbox" for testing

# 4. Monitor logs for errors
```

### R2 Files Not Uploading

**Cause:** R2 credentials incorrect or bucket misconfigured

**Solution:**
```bash
# 1. Verify credentials in R2 Dashboard
#    Account → R2 → Settings → API Tokens

# 2. Check bucket is public (for downloads)
#    R2 Dashboard → Bucket Settings → Public Access

# 3. Test connection
#    Try uploading a file through dashboard

# 4. Check environment variables
echo $R2_ACCOUNT_ID
echo $R2_BUCKET_NAME
```

---

## 📊 Performance Monitoring

### Key Metrics to Monitor

```
Metric                  Target          Tools
─────────────────────────────────────────────────────
Page Load Time          < 2s            Vercel Analytics
API Response Time       < 200ms         Supabase Dashboard
Database Query Time     < 50ms          Prisma Studio
Server Uptime           99.9%           Vercel Status
Error Rate              < 0.1%          Sentry / Vercel Logs
```

### Monitoring Setup

**Vercel Analytics (Built-in):**
1. Go to Dashboard → Analytics
2. Enable "Web Vitals"
3. Monitor LCP, FID, CLS

**Supabase Monitoring:**
1. Go to Dashboard → Logs → API Overview
2. Monitor slow queries (> 1s)
3. Check connection pool usage

**Error Tracking (Optional):**
```bash
# Install Sentry (catch runtime errors)
bun add @sentry/nextjs
```

---

## 🔄 Maintenance & Updates

### Regular Tasks

**Weekly:**
- [ ] Check error logs
- [ ] Verify backups exist
- [ ] Monitor uptime

**Monthly:**
- [ ] Update dependencies: `bun update`
- [ ] Review database size
- [ ] Backup Supabase data

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Plan feature updates

### Backup Strategy

**Supabase Auto-Backups:**
- Supabase backs up daily automatically
- Backups retained for 30 days
- Manual backups can be created via Dashboard

**Database Export (Manual):**
```bash
# Export database dump
bun prisma db seed  # Export seed for re-initialization

# Or via Supabase CLI
bun supabase db pull  # Creates migrations/
```

---

## 🎉 You're Live!

Congratulations! Keevan Store is now deployed to production.

**Next Steps:**
1. Announce the launch
2. Monitor logs for first 24 hours
3. Gather user feedback
4. Plan improvements

---

**Support & Questions:**
- GitHub Issues: [your-repo-url]/issues
- Documentation: See `ARCHITECTURE.md`
- Monitoring: Check deployment logs regularly

**Version:** 0.2.0 | **Last Updated:** 2026-06-17
