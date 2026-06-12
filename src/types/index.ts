// ============================================================
// Keevan Store — TypeScript Types & Interfaces
// ============================================================

// ── Enums ──────────────────────────────────────────────────
export enum ProductType {
  DIGITAL = "digital",
  EVENT = "event",
}

export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum OrderStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum WithdrawalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  PROCESSING = "processing",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

export enum PaymentMethod {
  MTN_MOMO = "mtn_momo",
  AIRTEL_MONEY = "airtel_money",
  BANK_TRANSFER = "bank_transfer",
  CARD = "card",
}

// ── Database Models ────────────────────────────────────────
export interface Creator {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
  bannerUrl: string | null;
  socialLinks: SocialLink[];
  donationsEnabled: boolean;
  donationGoal: number | null;
  donationCurrent: number;
  balance: number;
  totalEarnings: number;
  totalSales: number;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  platform: "instagram" | "tiktok" | "twitter" | "whatsapp";
  url: string;
}

export interface Product {
  id: string;
  creatorId: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  type: ProductType;
  status: ProductStatus;
  thumbnailUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  // Event-specific fields
  venue: string | null;
  eventDate: string | null;
  capacity: number | null;
  ticketsSold: number;
  // Metadata
  views: number;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  productId: string;
  venue: string;
  eventDate: string;
  capacity: number;
  ticketsSold: number;
  createdAt: string;
}

export interface Order {
  id: string;
  creatorId: string;
  productId: string;
  buyerEmail: string;
  buyerName: string;
  amount: number;
  platformFee: number;
  creatorEarning: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  pesapalOrderTrackingId: string | null;
  pesapalTransactionId: string | null;
  downloadToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageView {
  id: string;
  creatorId: string;
  page: string;
  referrer: string | null;
  createdAt: string;
}

export interface Donation {
  id: string;
  creatorId: string;
  donorEmail: string;
  donorName: string;
  amount: number;
  message: string;
  anonymous: boolean;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  creatorId: string;
  amount: number;
  status: WithdrawalStatus;
  phoneNumber: string;
  provider: string;
  createdAt: string;
  processedAt: string | null;
}

export interface Ticket {
  id: string;
  orderId: string;
  productId: string;
  buyerEmail: string;
  buyerName: string;
  qrCode: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
}

// ── API Request Types ──────────────────────────────────────
export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  currency: string;
  type: ProductType;
  thumbnailUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  venue?: string;
  eventDate?: string;
  capacity?: number;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  price?: number;
  status?: ProductStatus;
  thumbnailUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  venue?: string;
  eventDate?: string;
  capacity?: number;
}

export interface UpdateStoreRequest {
  displayName?: string;
  bio?: string;
  photoUrl?: string;
  bannerUrl?: string;
  socialLinks?: SocialLink[];
  donationsEnabled?: boolean;
  donationGoal?: number | null;
}

export interface CheckoutRequest {
  buyerEmail: string;
  buyerName: string;
  paymentMethod: PaymentMethod;
  productId: string;
}

export interface DonationRequest {
  donorEmail: string;
  donorName: string;
  amount: number;
  message: string;
  anonymous: boolean;
  creatorId: string;
}

// ── API Response Types ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  balance: number;
  totalViews: number;
  recentOrders: Order[];
  salesByDay: { date: string; sales: number; revenue: number }[];
}

export interface StorePublicData {
  creator: Creator;
  products: Product[];
}
