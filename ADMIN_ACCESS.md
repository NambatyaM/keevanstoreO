# Admin Access

## Default Admin Credentials

- **Email:** admin@keevanstore.com
- **Username:** admin
- **Password:** (Set via Supabase Auth - see setup instructions below)

## Initial Setup

### Step 1: Seed the Admin User

Run the Prisma seed script to create the admin user in the database:

```bash
npm run db:seed
```

This will create an admin user with:
- Email: admin@keevanstore.com
- Username: admin
- Display Name: Keevan Store Admin
- Role: Admin (is_admin = true)
- Status: Active and Verified

### Step 2: Set Password via Supabase

After seeding, you need to set the admin password through Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Find the user with email `admin@keevanstore.com`
4. Click "Reset Password" to set a secure password
5. Use a strong password (minimum 8 characters, recommended: Admin123!)

### Step 3: Access the Admin Dashboard

1. Navigate to `/login` in your application
2. Log in with `admin@keevanstore.com` and the password you set
3. Navigate to `/admin` to access the admin dashboard

## Admin Dashboard Features

The admin dashboard at `/admin` provides:

- **Overview Tab:** Platform-wide statistics (creators, products, revenue, fees)
- **Creators Tab:** Manage creator accounts (activate/deactivate, verify/unverify)
- **Withdrawals Tab:** Approve or reject withdrawal requests
- **Orders Tab:** View all orders with filtering by status

## Security Notes

- The admin role is protected by middleware in `src/middleware.ts`
- Admin routes require both authentication AND admin role verification
- The middleware checks the `is_admin` field in the `creators` table
- Non-admin users are automatically redirected to `/login` when accessing `/admin/*`

## Changing Admin Credentials

### Option 1: Via Supabase Dashboard
1. Go to Supabase Authentication > Users
2. Find the admin user
3. Reset password or update email

### Option 2: Direct Database Update
```sql
UPDATE creators 
SET email = 'new-admin@keevanstore.com',
    username = 'newadmin'
WHERE email = 'admin@keevanstore.com';
```

Then update the password via Supabase Auth.

### Option 3: Create Additional Admins
To create additional admin users, modify `prisma/seed.ts` or insert directly:

```sql
INSERT INTO creators (id, email, username, display_name, is_admin, is_verified, is_active)
VALUES ('new-admin-id', 'new-admin@example.com', 'newadmin', 'New Admin', true, true, true);
```

## Troubleshooting

### Admin login fails
- Verify the user exists in the `creators` table with `is_admin = true`
- Check that the user is active (`is_active = true`)
- Ensure the password is set correctly in Supabase Auth
- Check middleware logs for authentication errors

### Cannot access /admin route
- Verify you are logged in
- Check that your user has `is_admin = true` in the database
- Clear browser cookies and try logging in again
- Check browser console for authentication errors

### Seed script fails
- Ensure `DATABASE_URL` is set in `.env`
- Run `npm run db:push` to ensure schema is up to date
- Check that PostgreSQL is accessible
- Verify Prisma client is generated: `npx prisma generate`
