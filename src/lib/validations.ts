// ============================================================
// Keevan Store — Zod Validation Schemas
// FIXED: Blueprint Phase 3 — Centralised schemas shared between
// API route handlers and frontend forms to prevent mismatches.
// ============================================================
import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Username can only contain lowercase letters, numbers, and hyphens"),
  displayName: z.string().min(1, "Display name is required").max(100),
});

// ── Products ────────────────────────────────────────────────

export const createProductSchema = z.object({
  creatorId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).default(""),
  price: z.number().int().min(1000, "Minimum price is UGX 1,000"),
  currency: z.string().default("UGX"),
  type: z.enum(["digital", "event"]),
  thumbnailUrl: z.string().url().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
  // Event-specific (required when type === "event")
  venue: z.string().max(300).nullable().optional(),
  eventDate: z.string().datetime({ offset: true }).nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "digital" && !data.fileUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "File URL is required for digital products", path: ["fileUrl"] });
  }
  if (data.type === "event") {
    if (!data.venue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Venue is required for events", path: ["venue"] });
    if (!data.eventDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Event date is required", path: ["eventDate"] });
    if (!data.capacity) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Capacity is required for events", path: ["capacity"] });
  }
});

export const updateProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().int().min(1000).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
  venue: z.string().max(300).nullable().optional(),
  eventDate: z.string().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
});

// ── Checkout ────────────────────────────────────────────────

export const checkoutSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  buyerEmail: z.string().email("Invalid email address"),
  buyerName: z.string().min(1, "Name is required").max(200),
  paymentMethod: z.enum(["mtn_momo", "airtel_money", "bank_transfer", "card"] as const, {
    error: "Invalid payment method",
  }),
  donationAmount: z.number().int().min(0).optional().default(0),
});

// ── Withdrawals ─────────────────────────────────────────────

export const createWithdrawalSchema = z.object({
  creatorId: z.string().min(1),
  amount: z.number().int().min(50000, "Minimum withdrawal is UGX 50,000"),
  method: z.enum(["mobile_money", "bank_transfer"]).optional(),
  phoneNumber: z.string().min(9, "Valid phone number required").max(20),
  provider: z.string().min(1, "Provider is required"),
});

// ── Donations ───────────────────────────────────────────────

export const createDonationSchema = z.object({
  creatorId: z.string().min(1),
  amount: z.number().int().min(1000, "Minimum donation is UGX 1,000"),
  donorEmail: z.string().email().optional().or(z.literal("")),
  donorName: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
  anonymous: z.boolean().optional().default(false),
});

// ── Store Updates ───────────────────────────────────────────

export const updateStoreSchema = z.object({
  creatorId: z.string().min(1),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  photoUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  socialLinks: z.array(z.object({
    platform: z.enum(["instagram", "tiktok", "twitter", "whatsapp"]),
    url: z.string().url(),
  })).optional(),
  donationsEnabled: z.boolean().optional(),
  donationGoal: z.number().int().positive().nullable().optional(),
});

// ── Page Views ──────────────────────────────────────────────

export const pageViewSchema = z.object({
  creatorId: z.string().min(1),
  page: z.enum(["store", "product"]),
  referrer: z.string().max(500).nullable().optional(),
  productId: z.string().optional(),
});

// ── Admin Actions ───────────────────────────────────────────

export const adminCreatorActionSchema = z.object({
  creatorId: z.string().min(1),
  action: z.enum(["activate", "deactivate", "verify", "unverify"]),
});

export const adminWithdrawalActionSchema = z.object({
  withdrawalId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

// ── Type Exports ────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
