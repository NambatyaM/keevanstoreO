# R2 Bucket Setup for Image Loading

This document provides instructions for configuring your Cloudflare R2 bucket to allow public image access.

## Issue: Images Not Loading

If images are showing alt text instead of loading, your R2 bucket needs to be configured for public access.

## Step 1: Set Bucket to Public

1. Go to Cloudflare Dashboard → R2 → Your Bucket
2. Click "Settings" tab
3. Find "Public Access" section
4. Click "Allow Access"
5. This will make your bucket publicly readable at `https://pub-{ACCOUNT_ID}.r2.dev/{BUCKET_NAME}/{KEY}`

## Step 2: Add CORS Rule (Optional but Recommended)

If you need to access images from your frontend with JavaScript (e.g., canvas operations), add a CORS rule:

1. Go to Cloudflare Dashboard → R2 → Your Bucket
2. Click "Settings" tab
3. Scroll to "CORS" section
4. Add the following CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## Step 3: Verify Configuration

After setting up, test by accessing an image URL directly in your browser:

```
https://pub-{YOUR_ACCOUNT_ID}.r2.dev/{YOUR_BUCKET_NAME}/{FILE_KEY}
```

If the image loads, your bucket is properly configured.

## Alternative: Custom Domain (Recommended for Production)

For production, consider setting up a custom domain:

1. Go to Cloudflare Dashboard → R2 → Your Bucket
2. Click "Settings" → "Custom Domains"
3. Add your domain (e.g., `cdn.yourdomain.com`)
4. Update your DNS records as instructed
5. Update `next.config.ts` to include your custom domain:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "cdn.yourdomain.com",
    },
  ],
},
```

## Troubleshooting

**Images still not loading after public access:**
- Check that the URL format is correct: `https://pub-{ACCOUNT_ID}.r2.dev/{BUCKET}/{KEY}`
- Check browser console for specific error messages
- Verify the file was actually uploaded successfully (check R2 dashboard)

**403 Forbidden errors:**
- Ensure public access is enabled on the bucket
- Check that the bucket name and key in the URL match exactly

**CORS errors in browser console:**
- Add the CORS rule as shown in Step 2
- Include your development and production domains in AllowedOrigins
