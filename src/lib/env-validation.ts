// ============================================================
// Environment Variable Validation
// Validates required environment variables at startup
// ============================================================

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
}

const ENV_CONFIG: EnvVarConfig[] = [
  // Database
  { name: "DATABASE_URL", required: true, description: "Database connection string" },
  
  // Supabase
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, description: "Supabase project URL" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, description: "Supabase anonymous key" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, description: "Supabase service role key" },
  
  // Application
  { name: "NEXT_PUBLIC_APP_URL", required: true, description: "Application base URL" },
  
  // R2 Storage (optional - falls back to mock mode)
  { name: "R2_ACCOUNT_ID", required: false, description: "Cloudflare R2 account ID" },
  { name: "R2_ACCESS_KEY_ID", required: false, description: "Cloudflare R2 access key" },
  { name: "R2_SECRET_ACCESS_KEY", required: false, description: "Cloudflare R2 secret key" },
  { name: "R2_BUCKET_NAME", required: false, description: "Cloudflare R2 bucket name" },
  
  // Pesapal (optional - payments will fail without it)
  { name: "PESAPAL_CONSUMER_KEY", required: false, description: "Pesapal consumer key" },
  { name: "PESAPAL_CONSUMER_SECRET", required: false, description: "Pesapal consumer secret" },
  { name: "PESAPAL_API_URL", required: false, description: "Pesapal API URL" },
  { name: "PESAPAL_IPN_URL", required: false, description: "Pesapal IPN URL" },
  { name: "PESAPAL_MODE", required: false, description: "Pesapal mode (live/test)" },
  
  // Admin
  { name: "ADMIN_WHATSAPP_NUMBER", required: false, description: "Admin WhatsApp number" },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const config of ENV_CONFIG) {
    const value = process.env[config.name];
    
    if (config.required && !value) {
      errors.push(`Missing required environment variable: ${config.name} (${config.description})`);
    } else if (!value) {
      warnings.push(`Optional environment variable not set: ${config.name} (${config.description})`);
    }
  }

  // Validate URL formats
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_APP_URL);
    } catch {
      errors.push(`Invalid NEXT_PUBLIC_APP_URL format: ${process.env.NEXT_PUBLIC_APP_URL}`);
    }
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    } catch {
      errors.push(`Invalid NEXT_PUBLIC_SUPABASE_URL format: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function getEnvValidation(): ValidationResult {
  const result = validateEnv();
  
  if (!result.valid && process.env.NODE_ENV === "production") {
    console.error("❌ Environment validation failed:");
    result.errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error("Invalid environment configuration");
  }

  if (result.warnings.length > 0) {
    console.warn("⚠️  Environment warnings:");
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (result.valid) {
    console.log("✅ Environment validation passed");
  }

  return result;
}

// Check if R2 is properly configured
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

// Check if Pesapal is properly configured
export function isPesapalConfigured(): boolean {
  return !!(
    process.env.PESAPAL_CONSUMER_KEY &&
    process.env.PESAPAL_CONSUMER_SECRET &&
    process.env.PESAPAL_API_URL
  );
}
