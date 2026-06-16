// ============================================================
// DB Mappers — snake_case ↔ camelCase conversion for Supabase
// ============================================================
import type {
  Creator,
  Product,
  Order,
  Donation,
  Withdrawal,
  Ticket,
  PageView,
  SocialLink,
} from "@/types";

// ── Creator Mappers ──────────────────────────────────────────

export function mapCreatorFromDb(row: Record<string, unknown>): Creator {
  return {
    id: row.id as string,
    email: row.email as string,
    username: row.username as string,
    displayName: (row.display_name ?? row.displayName) as string,
    bio: (row.bio ?? "") as string,
    photoUrl: (row.photo_url ?? row.photoUrl ?? null) as string | null,
    bannerUrl: (row.banner_url ?? row.bannerUrl ?? null) as string | null,
    socialLinks: (row.social_links ?? row.socialLinks ?? []) as SocialLink[],
    donationsEnabled: (row.donations_enabled ?? row.donationsEnabled ?? false) as boolean,
    donationGoal: (row.donation_goal ?? row.donationGoal ?? null) as number | null,
    donationCurrent: Number(row.donation_current ?? row.donationCurrent ?? 0),
    balance: Number(row.balance ?? 0),
    totalEarnings: Number(row.total_earnings ?? row.totalEarnings ?? 0),
    totalSales: Number(row.total_sales ?? row.totalSales ?? 0),
    totalViews: Number(row.total_views ?? row.totalViews ?? 0),
    isAdmin: (row.is_admin ?? row.isAdmin ?? false) as boolean,
    createdAt: (row.created_at ?? row.createdAt ?? new Date().toISOString()) as string,
    updatedAt: (row.updated_at ?? row.updatedAt ?? new Date().toISOString()) as string,
  };
}

export function mapCreatorToDb(
  creator: Partial<Creator>
): Record<string, unknown> {
  const mapping: Record<string, unknown> = {};

  if (creator.displayName !== undefined) mapping.display_name = creator.displayName;
  if (creator.bio !== undefined) mapping.bio = creator.bio;
  if (creator.photoUrl !== undefined) mapping.photo_url = creator.photoUrl;
  if (creator.bannerUrl !== undefined) mapping.banner_url = creator.bannerUrl;
  if (creator.socialLinks !== undefined) mapping.social_links = creator.socialLinks;
  if (creator.donationsEnabled !== undefined) mapping.donations_enabled = creator.donationsEnabled;
  if (creator.donationGoal !== undefined) mapping.donation_goal = creator.donationGoal;

  return mapping;
}

// ── Product Mappers ──────────────────────────────────────────

export function mapProductFromDb(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    creatorId: (row.creator_id ?? row.creatorId) as string,
    title: row.title as string,
    slug: row.slug as string,
    description: (row.description ?? "") as string,
    price: Number(row.price),
    currency: (row.currency ?? "UGX") as string,
    type: (row.type ?? "digital") as Product["type"],
    status: (row.status ?? "active") as Product["status"],
    thumbnailUrl: (row.thumbnail_url ?? row.thumbnailUrl ?? null) as string | null,
    fileUrl: (row.file_url ?? row.fileUrl ?? null) as string | null,
    fileName: (row.file_name ?? row.fileName ?? null) as string | null,
    fileSize: (row.file_size ?? row.fileSize ?? null) as number | null,
    venue: (row.venue ?? null) as string | null,
    eventDate: (row.event_date ?? row.eventDate ?? null) as string | null,
    capacity: (row.capacity ?? null) as number | null,
    ticketsSold: Number(row.tickets_sold ?? row.ticketsSold ?? 0),
    views: Number(row.views ?? 0),
    salesCount: Number(row.sales_count ?? row.salesCount ?? 0),
    createdAt: (row.created_at ?? row.createdAt ?? new Date().toISOString()) as string,
    updatedAt: (row.updated_at ?? row.updatedAt ?? new Date().toISOString()) as string,
  };
}

export function mapProductToDb(
  product: Record<string, unknown>
): Record<string, unknown> {
  const mapping: Record<string, unknown> = {};

  if (product.creatorId !== undefined) mapping.creator_id = product.creatorId;
  if (product.title !== undefined) mapping.title = product.title;
  if (product.slug !== undefined) mapping.slug = product.slug;
  if (product.description !== undefined) mapping.description = product.description;
  if (product.price !== undefined) mapping.price = product.price;
  if (product.currency !== undefined) mapping.currency = product.currency;
  if (product.type !== undefined) mapping.type = product.type;
  if (product.status !== undefined) mapping.status = product.status;
  if (product.thumbnailUrl !== undefined) mapping.thumbnail_url = product.thumbnailUrl;
  if (product.fileUrl !== undefined) mapping.file_url = product.fileUrl;
  if (product.fileName !== undefined) mapping.file_name = product.fileName;
  if (product.fileSize !== undefined) mapping.file_size = product.fileSize;
  if (product.venue !== undefined) mapping.venue = product.venue;
  if (product.eventDate !== undefined) mapping.event_date = product.eventDate;
  if (product.capacity !== undefined) mapping.capacity = product.capacity;

  return mapping;
}

// ── Order Mappers ────────────────────────────────────────────

export function mapOrderFromDb(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    creatorId: (row.creator_id ?? row.creatorId) as string,
    productId: (row.product_id ?? row.productId ?? null) as string | null,
    buyerEmail: (row.buyer_email ?? row.buyerEmail ?? "") as string,
    buyerName: (row.buyer_name ?? row.buyerName ?? "") as string,
    amount: Number(row.amount),
    platformFee: Number(row.platform_fee ?? row.platformFee ?? 0),
    creatorEarning: Number(row.creator_earning ?? row.creatorEarning ?? 0),
    currency: (row.currency ?? "UGX") as string,
    status: (row.status ?? "pending") as Order["status"],
    paymentMethod: (row.payment_method ?? row.paymentMethod ?? "mtn_momo") as Order["paymentMethod"],
    pesapalOrderTrackingId: (row.pesapal_order_tracking_id ?? row.pesapalOrderTrackingId ?? null) as string | null,
    pesapalTransactionId: (row.pesapal_transaction_id ?? row.pesapalTransactionId ?? null) as string | null,
    downloadToken: (row.download_token ?? row.downloadToken ?? null) as string | null,
    createdAt: (row.created_at ?? row.createdAt ?? new Date().toISOString()) as string,
    updatedAt: (row.updated_at ?? row.updatedAt ?? new Date().toISOString()) as string,
  };
}

// ── Donation Mappers ─────────────────────────────────────────

export function mapDonationFromDb(row: Record<string, unknown>): Donation {
  return {
    id: row.id as string,
    creatorId: (row.creator_id ?? row.creatorId) as string,
    orderId: (row.order_id ?? row.orderId ?? null) as string | null,
    donorEmail: (row.donor_email ?? row.donorEmail ?? "") as string,
    donorName: (row.donor_name ?? row.donorName ?? "Anonymous") as string,
    amount: Number(row.amount),
    message: (row.message ?? "") as string,
    anonymous: (row.is_anonymous ?? row.anonymous ?? false) as boolean,
    createdAt: (row.created_at ?? row.createdAt ?? new Date().toISOString()) as string,
  };
}

// ── Withdrawal Mappers ───────────────────────────────────────

export function mapWithdrawalFromDb(row: Record<string, unknown>): Withdrawal {
  const accountDetails = (row.account_details ?? row.accountDetails) as Record<string, unknown> | null;
  return {
    id: row.id as string,
    creatorId: (row.creator_id ?? row.creatorId) as string,
    amount: Number(row.amount),
    status: (row.status ?? "pending") as Withdrawal["status"],
    phoneNumber: (accountDetails?.phoneNumber ?? accountDetails?.phone_number ?? "") as string,
    provider: (accountDetails?.provider ?? row.method ?? "") as string,
    createdAt: (row.requested_at ?? row.created_at ?? row.createdAt ?? new Date().toISOString()) as string,
    processedAt: (row.processed_at ?? row.processedAt ?? null) as string | null,
  };
}

export function mapWithdrawalToDb(
  withdrawal: Partial<Withdrawal>
): Record<string, unknown> {
  const mapping: Record<string, unknown> = {};

  if (withdrawal.creatorId !== undefined) mapping.creator_id = withdrawal.creatorId;
  if (withdrawal.amount !== undefined) mapping.amount = withdrawal.amount;
  if (withdrawal.phoneNumber !== undefined || withdrawal.provider !== undefined) {
    mapping.account_details = {
      phoneNumber: withdrawal.phoneNumber ?? "",
      provider: withdrawal.provider ?? "",
    };
  }
  if (withdrawal.provider !== undefined) {
    mapping.method = withdrawal.provider.toLowerCase().includes("bank")
      ? "bank_transfer"
      : "mobile_money";
  }

  return mapping;
}

// ── Ticket Mappers ───────────────────────────────────────────

export function mapTicketFromDb(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    orderId: (row.order_id ?? row.orderId) as string,
    eventId: (row.event_id ?? row.eventId) as string,
    productId: (row.product_id ?? row.productId ?? "") as string,
    buyerEmail: (row.buyer_email ?? row.buyerEmail ?? "") as string,
    buyerName: (row.buyer_name ?? row.buyerName ?? "") as string,
    qrCode: (row.qr_code_data ?? row.qrCode ?? "") as string,
    checkedIn: (row.checked_in ?? row.checkedIn ?? false) as boolean,
    checkedInAt: (row.checked_in_at ?? row.checkedInAt ?? null) as string | null,
    createdAt: (row.created_at ?? row.createdAt ?? new Date().toISOString()) as string,
  };
}

// ── PageView Mappers ─────────────────────────────────────────

export function mapPageViewFromDb(row: Record<string, unknown>): PageView {
  return {
    id: row.id as string,
    creatorId: (row.creator_id ?? row.creatorId) as string,
    page: (row.view_type ?? row.page ?? "store") as string,
    referrer: (row.referrer ?? null) as string | null,
    createdAt: (row.created_at ?? row.createdAt ?? new Date().toISOString()) as string,
  };
}
