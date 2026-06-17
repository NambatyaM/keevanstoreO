# Keevan Store - Database Setup Guide

## Current Issue
Your authentication button keeps loading because the Supabase database schema hasn't been applied to your project yet. The app tries to create a creator profile but the table doesn't exist.

## Solution: Apply Database Schema to Supabase

### Step 1: Get Your Supabase Credentials
1. Go to https://supabase.com/dashboard/projects
2. Select your project (snkqgqeiuxgusgtwwssc)
3. Go to **Project Settings** (bottom left) → **Database**
4. Note your database connection details

### Step 2: Apply the Schema

**Option A: Using Supabase SQL Editor (Easiest)**
1. Go to your Supabase project dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the ENTIRE content from `supabase/schema.sql` in your project
5. Click **Run** (or Cmd+Enter)
6. Wait for completion - you should see all tables created

**Option B: Using psql Command Line**
```bash
# Replace with your actual connection string from .env
psql "postgresql://postgres:[YOUR-DB-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < supabase/schema.sql
```

### Step 3: Verify Database Setup
1. After running the schema, go to **Supabase** → **SQL Editor**
2. Run this test query:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
3. You should see tables: `creators`, `products`, `orders`, `withdrawals`, `contact_messages`, etc.

### Step 4: Enable Row Level Security (RLS)

Run these in your Supabase SQL Editor:

```sql
-- Enable RLS on creators table
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- Allow public signup (insert their own profile)
CREATE POLICY "creators_insert_own" ON creators
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "creators_read_own" ON creators
  FOR SELECT USING (auth.uid() = id);

-- Allow public to read active creator stores
CREATE POLICY "creators_public_store" ON creators
  FOR SELECT USING (is_active = true);
```

### Step 5: Test the Connection

**Option 1: Using the Health Check**
```bash
# Start your app (if not running)
npm run dev

# In another terminal, test the database health check
curl http://localhost:3000/api/health/db

# Should return:
# {"status":"healthy","message":"Database connection successful",...}
```

**Option 2: Try Demo Login**
1. Open your app at http://localhost:3000
2. Click **Sign In**
3. Click **Try Demo Account** button
4. Should login as: sarah@keevan.store / sarah123

**Option 3: Try Creating Account**
1. Go to **Sign Up**
2. Fill in a test account with any email
3. If it works, you'll see "Welcome to Keevan Store!"

## Troubleshooting

### Button Still Loading?
1. Open browser **DevTools** → **Network** tab
2. Try signing up
3. Click the **POST /api/auth/signup** request
4. Check the response - you'll now see detailed error messages
5. Common errors:
   - `"relation \"creators\" does not exist"` → Schema not applied
   - `"Supabase not configured"` → Check .env file
   - `"Database connection timeout"` → Check DATABASE_URL in .env

### "creators table does not exist"
- Run the schema.sql file again in Supabase SQL Editor
- Check that you're in the `public` schema, not another schema

### Can't find Supabase SQL Editor
1. Go to https://supabase.com/dashboard/projects
2. Select your project
3. In the left sidebar, find **SQL Editor** 
4. If not visible, scroll down in the sidebar

## Mock Mode (Temporary Workaround)

If you want to test the app WITHOUT setting up the database:

1. Edit `.env` file
2. Change this line:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://snkqgqeiuxgusgtwwssc.supabase.co
   ```
   To this:
   ```
   NEXT_PUBLIC_SUPABASE_URL=mock
   ```
3. Restart your app: `npm run dev`
4. Now you can sign up/login with demo data (in-memory only)
5. Demo accounts:
   - sarah@keevan.store / sarah123
   - james@keevan.store / james123
   - nina@keevan.store / nina123

**⚠️ Important**: When switching back to real Supabase, change it back to:
```
NEXT_PUBLIC_SUPABASE_URL=https://snkqgqeiuxgusgtwwssc.supabase.co
```

## Next Steps

1. ✅ Apply schema to Supabase (Step 1-3 above)
2. ✅ Enable RLS (Step 4)
3. ✅ Test database connection
4. ✅ Try signing up with a test account
5. Once working, you can create admin accounts, configure payment settings, etc.

## Need Help?

Check server logs for detailed error messages:
```bash
# Watch Next.js server logs
npm run dev
# Look for errors when you try to sign up
```

Contact Supabase support if database connection fails:
- Project: snkqgqeiuxgusgtwwssc
- Database: postgres
- Connection: aws-0-us-east-1.pooler.supabase.com
