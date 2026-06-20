// ============================================================
// Environment Variable Validation
// Validates required environment variables at startup
// ============================================================

interface EnvVarConfig {
  name: string;
  required: boolean;
  requiredInProduction: boolean;
  description: string;
}

const ENV_CONFIG: EnvVarConfig[] = [
  // Database
  { name: "DATABASE_URL", required: true, requiredInProduction: true, description: "Database connection string" },

  // Supabase
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, requiredInProduction: true, description: "Supabase project URL" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, requiredInProduction: true, description: "Supabase anonymous key" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, requiredInProduction: true, description: "Supabase service role key" },

  // Application
  { name: "NEXT_PUBLIC_APP_URL", required: true, requiredInProduction: true, description: "Application base URL" },

  // R2 Storage (required in production for file uploads)
  { name: "R2_ACCOUNT_ID", required: false, requiredInProduction: true, description: "Cloudflare R2 account ID" },
  { name: "R2_ACCESS_KEY_ID", required: false, requiredInProduction: true, description: "Cloudflare R2 access key" },
  { name: "R2_SECRET_ACCESS_KEY", required: false, requiredInProduction: true, description: "Cloudflare R2 secret key" },
  { name: "R2_BUCKET_NAME", required: false, requiredInProduction: true, description: "Cloudflare R2 bucket name" },

  // Pesapal (optional - payments will fail without it)
  { name: "PESAPAL_CONSUMER_KEY", required: false, requiredInProduction: false, description: "Pesapal consumer key" },
  { name: "PESAPAL_CONSUMER_SECRET", required: false, requiredInProduction: false, description: "Pesapal consumer secret" },
  { name: "PESAPAL_API_URL", required: false, requiredInProduction: false, description: "Pesapal API URL" },
  { name: "PESAPAL_IPN_URL", required: false, requiredInProduction: false, description: "Pesapal IPN URL" },
  { name: "PESAPAL_MODE", required: false, requiredInProduction: false, description: "Pesapal mode (live/test)" },

  // Admin
  { name: "ADMIN_WHATSAPP_NUMBER", required: false, requiredInProduction: false, description: "Admin WhatsApp number" },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  for (const config of ENV_CONFIG) {
    const value = process.env[config.name];
    const isRequired = isProduction ? config.requiredInProduction : config.required;

    if (isRequired && !value) {
      errors.push(`Missing required environment variable: ${config.name} (${config.description})`);
    } else if (!value && config.required) {
      warnings.push(`Optional environment variable not set: ${config.name} (${config.description})`);
    } else if (!value && !config.required) {
      // Optional variable not set - no warning
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
    process.env.R2_BUCKET_NAME &&
    process.env.R2_ACCOUNT_ID !== "mock" &&
    process.env.R2_ACCESS_KEY_ID !== "mock" &&
    process.env.R2_SECRET_ACCESS_KEY !== "mock" &&
    process.env.R2_BUCKET_NAME !== "mock"
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
