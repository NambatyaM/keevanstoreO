# Cloudflare R2 CORS Configuration Guide

This guide explains how to configure Cloudflare R2 CORS (Cross-Origin Resource Sharing) for your Keevan Store application to work with your custom domain `keevanstore.in`.

## Why CORS is Required

When your application runs on `keevanstore.in` and uploads files to R2, the browser enforces CORS policies. Without proper CORS configuration, the browser will block the upload requests.

## Step-by-Step Configuration

### 1. Access Your R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** > **Your Buckets**
3. Select your bucket (e.g., `keevanstore`)

### 2. Configure CORS Rules

1. Click on **Settings** tab
2. Scroll down to **CORS Policy** section
3. Click **Edit CORS Policy**
4. Add the following CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "https://keevanstore.in",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Explanation of CORS Rules

- **AllowedOrigins**: Your production domain (`https://keevanstore.in`) and local development (`http://localhost:3000`)
- **AllowedMethods**: HTTP methods your application uses (GET, PUT, POST, DELETE, HEAD)
- **AllowedHeaders**: Allows all headers (`*`) for flexibility
- **ExposeHeaders**: Headers that the browser can access in the response
- **MaxAgeSeconds**: How long the browser can cache the CORS policy (1 hour)

### 4. Save and Test

1. Click **Save** to apply the CORS policy
2. Wait a few seconds for the changes to propagate
3. Test your upload functionality on `keevanstore.in`

## Verification

### Check CORS Configuration via API

You can verify your CORS configuration using the Cloudflare API:

```bash
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/{BUCKET_NAME}/cors" \
  -H "Authorization: Bearer {API_TOKEN}"
```

### Test Upload in Browser

1. Open your browser's Developer Tools (F12)
2. Go to the **Network** tab
3. Try uploading a file on your site
4. Check the upload request for CORS headers:
   - Look for `Access-Control-Allow-Origin` header
   - It should include `https://keevanstore.in`

## Common Issues and Solutions

### Issue: CORS Error in Browser Console

**Error**: `Access to fetch at 'https://...' from origin 'https://keevanstore.in' has been blocked by CORS policy`

**Solution**:
1. Verify your CORS policy includes `https://keevanstore.in` in AllowedOrigins
2. Check that the domain is exactly correct (no trailing slash)
3. Clear your browser cache and try again
4. Wait a few minutes for CORS changes to propagate

### Issue: Upload Fails with 403 Forbidden

**Error**: Upload request returns 403 status

**Solution**:
1. Verify your R2 API credentials are correct
2. Check that your R2 token has the necessary permissions
3. Ensure the bucket name matches exactly

### Issue: Upload Works on Localhost but Not on Production

**Solution**:
1. Make sure `https://keevanstore.in` is in AllowedOrigins
2. Check that your environment variables are set correctly in Vercel
3. Verify `NEXT_PUBLIC_APP_URL` is set to `https://keevanstore.in`

## Environment Variables Checklist

Ensure these are set in your Vercel project:

- `R2_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_ACCESS_KEY_ID` - Your R2 access key ID
- `R2_SECRET_ACCESS_KEY` - Your R2 secret access key
- `R2_BUCKET_NAME` - Your R2 bucket name (e.g., `keevanstore`)
- `NEXT_PUBLIC_APP_URL` - `https://keevanstore.in`

## Testing Your Configuration

### Using the Health Check Endpoint

Your application includes a health check endpoint to verify R2 configuration:

```
GET /api/health/storage
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "storage": "r2",
    "configured": true,
    "ready": true,
    "missing": [],
    "details": {
      "hasAccountId": true,
      "hasAccessKeyId": true,
      "hasSecretKey": true,
      "hasBucketName": true
    }
  }
}
```

### Manual Upload Test

1. Log in to your account on `keevanstore.in`
2. Navigate to the product creation page
3. Try uploading a small image file
4. Check the browser console for any errors

## Security Best Practices

1. **Limit AllowedOrigins**: Only include domains you trust
2. **Use Specific Methods**: Only allow HTTP methods your application needs
3. **Set Reasonable MaxAge**: Don't set MaxAge too high (3600 seconds is reasonable)
4. **Monitor Access**: Regularly check your R2 access logs for unusual activity

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [CORS MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Cloudflare CORS Guide](https://developers.cloudflare.com/r2/data-access/cors/)

## Support

If you continue to experience issues after following this guide:

1. Check the browser console for specific error messages
2. Verify your environment variables in Vercel
3. Test the `/api/health/storage` endpoint
4. Review Cloudflare R2 logs for detailed error information
