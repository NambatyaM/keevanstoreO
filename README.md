# Keevan Store

The #1 e-commerce platform for Ugandan creators to sell digital products, event tickets, and accept donations with mobile money payments (MTN MoMo, Airtel Money).

## 🌟 Features

- **Digital Products**: Sell e-books, templates, presets, beats, and any digital file with automatic delivery
- **Event Tickets**: Create and sell tickets for events, workshops, and experiences with QR code check-in
- **Donations**: Accept donations from supporters with fundraising goals and progress tracking
- **Mobile Money Payments**: MTN Mobile Money and Airtel Money integration via Pesapal
- **Analytics Dashboard**: Track sales, views, and revenue in real-time
- **Custom Store URLs**: Your own branded store at `keevanstore.in/store/your-name`
- **90% Revenue Share**: Keep 90% of every sale (10% platform fee)
- **Free to Start**: No monthly subscriptions or hidden charges

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account (for database)
- Cloudflare R2 account (for file storage)
- Pesapal account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd keevanstore
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=keevanstore

# Pesapal Payments
PESAPAL_CONSUMER_KEY=your-pesapal-consumer-key
PESAPAL_CONSUMER_SECRET=your-pesapal-consumer-secret
PESAPAL_API_URL=https://pay.pesapal.com/v3/api
PESAPAL_IPN_URL=https://www.keevanstore.in/api/pesapal/ipn
PESAPAL_MODE=live

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_WHATSAPP_NUMBER=256768345905
```

4. **Set up the database**

Run the SQL setup script in your Supabase SQL editor:
```sql
-- See prisma/schema.sql or run the seed script
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

**Required Vercel Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Production URL (e.g., `https://www.keevanstore.in`)
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key ID
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name
- `PESAPAL_CONSUMER_KEY` - Pesapal consumer key
- `PESAPAL_CONSUMER_SECRET` - Pesapal consumer secret
- `PESAPAL_API_URL` - Pesapal API URL
- `PESAPAL_IPN_URL` - Production IPN webhook URL
- `PESAPAL_MODE` - Set to `live` for production

See [VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md) for detailed setup instructions.

### Cloudflare R2 Setup

1. Create an R2 bucket named `keevanstore`
2. Configure CORS in your R2 bucket settings:
```json
[
  {
    "AllowedOrigins": ["https://www.keevanstore.in"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

See [R2_CORS_SETUP.md](./R2_CORS_SETUP.md) for detailed instructions.

## 🏗️ Project Structure

```
keevanstore/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── store/          # Store pages
│   │   ├── layout.tsx      # Root layout with SEO
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   ├── lib/               # Utility functions
│   │   ├── r2.ts          # Cloudflare R2 integration
│   │   ├── pesapal.ts     # Pesapal payment integration
│   │   └── supabase/      # Supabase client
│   └── hooks/             # Custom React hooks
├── prisma/                # Database schema
├── public/                # Static assets
└── .env.example           # Environment variables template
```

## 🔧 Configuration

### Database

The project uses Supabase PostgreSQL with Prisma ORM. Run migrations:
```bash
npx prisma migrate dev
```

### File Storage

Files are stored in Cloudflare R2. The R2 integration handles:
- File uploads
- Signed URLs for secure downloads
- Automatic cleanup

### Payments

Payments are processed through Pesapal, supporting:
- MTN Mobile Money
- Airtel Money
- Bank transfers
- Visa/Mastercard cards

## 📊 SEO & Analytics

The platform is optimized for:
- **SEO**: Proper meta tags, sitemap, robots.txt, canonical URLs
- **AEO**: FAQ structured data for voice search
- **GEO**: LocalBusiness schema for Uganda/Kampala targeting
- **Keywords**: Uganda-specific keywords for better local search ranking

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, contact:
- WhatsApp: +256768345905
- Email: support@keevanstore.in
- Website: https://www.keevanstore.in

## 🤝 Contributing

This is a closed-source project. For collaboration inquiries, contact the team.

## 📄 Documentation

- [VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md) - Vercel deployment checklist
- [R2_CORS_SETUP.md](./R2_CORS_SETUP.md) - Cloudflare R2 CORS configuration
- [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) - Privacy policy
- [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) - Terms of service

## 🔐 Security

- All sensitive data stored in environment variables
- Service role keys never exposed to client
- R2 files served via signed URLs
- Rate limiting on API endpoints
- Input validation and sanitization

## 🌐 Live Site

- **Production**: https://www.keevanstore.in
- **Health Check**: https://www.keevanstore.in/api/health/storage

## 📈 Performance

- 99.9% uptime
- Fast page loads with Next.js optimization
- Static generation where possible
- Image optimization with Next.js Image component

## 💰 Pricing

- **Free to start**: No setup fees
- **10% platform fee**: You keep 90% of every sale
- **No monthly charges**: Pay only when you sell
- **Minimum withdrawal**: UGX 50,000

## 🎯 Target Audience

- Content creators in Uganda
- Digital product sellers (e-books, templates, beats)
- Event organizers
- Non-profit organizations
- Artists and musicians
- Educators and course creators
