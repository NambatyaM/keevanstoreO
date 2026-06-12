// ============================================================
// Mock Data Layer — Full demo data for sandbox testing
// ============================================================
import {
  type Creator,
  type Product,
  type Order,
  type PageView,
  type Donation,
  type Withdrawal,
  type Ticket,
  type DownloadSession,
  type DashboardStats,
  type StorePublicData,
  ProductType,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  WithdrawalStatus,
} from "@/types";

// ── Mock Creators ──────────────────────────────────────────
const mockCreators: Creator[] = [
  {
    id: "creator-1",
    email: "sarah@keevan.store",
    username: "sarah-creates",
    displayName: "Sarah Creates",
    bio: "Digital artist & content creator from Kampala. Selling beautiful templates, presets, and design resources.",
    photoUrl: "/demo-avatar-sarah.png",
    bannerUrl: "/demo-banner-sarah.png",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/sarahcreates" },
      { platform: "tiktok", url: "https://tiktok.com/@sarahcreates" },
      { platform: "twitter", url: "https://twitter.com/sarahcreates" },
    ],
    donationsEnabled: true,
    donationGoal: 5000000,
    donationCurrent: 1250000,
    balance: 347500,
    totalEarnings: 1850000,
    totalSales: 42,
    totalViews: 3820,
    isAdmin: true,
    createdAt: "2025-06-15T10:00:00Z",
    updatedAt: "2026-03-01T14:30:00Z",
  },
  {
    id: "creator-2",
    email: "james@keevan.store",
    username: "james-beats",
    displayName: "James Beats",
    bio: "Music producer & beat maker. High-quality beats, samples, and production kits for African artists.",
    photoUrl: null,
    bannerUrl: null,
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/jamesbeats" },
      { platform: "whatsapp", url: "https://wa.me/256700000000" },
    ],
    donationsEnabled: false,
    donationGoal: null,
    donationCurrent: 0,
    balance: 520000,
    totalEarnings: 3200000,
    totalSales: 78,
    totalViews: 5100,
    isAdmin: false,
    createdAt: "2025-04-10T08:00:00Z",
    updatedAt: "2026-03-02T09:15:00Z",
  },
  {
    id: "creator-3",
    email: "nina@keevan.store",
    username: "nina-events",
    displayName: "Nina Events",
    bio: "Event organizer based in Entebbe. Bringing you the best cultural events, workshops, and experiences.",
    photoUrl: null,
    bannerUrl: null,
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/ninaevents" },
      { platform: "twitter", url: "https://twitter.com/ninaevents" },
      { platform: "tiktok", url: "https://tiktok.com/@ninaevents" },
      { platform: "whatsapp", url: "https://wa.me/256710000000" },
    ],
    donationsEnabled: true,
    donationGoal: 2000000,
    donationCurrent: 750000,
    balance: 180000,
    totalEarnings: 950000,
    totalSales: 156,
    totalViews: 7200,
    isAdmin: false,
    createdAt: "2025-08-20T12:00:00Z",
    updatedAt: "2026-03-01T16:45:00Z",
  },
  {
    id: "creator-admin",
    email: "nkevinmegan@gmail.com",
    username: "keeva-admin",
    displayName: "Keeva Admin",
    bio: "Platform administrator and owner of Keevan Store.",
    photoUrl: null,
    bannerUrl: null,
    socialLinks: [],
    donationsEnabled: false,
    donationGoal: null,
    donationCurrent: 0,
    balance: 0,
    totalEarnings: 0,
    totalSales: 0,
    totalViews: 0,
    isAdmin: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-06-13T00:00:00Z",
  },
];

// ── Mock Products ──────────────────────────────────────────
const mockProducts: Product[] = [
  {
    id: "prod-1",
    creatorId: "creator-1",
    title: "Minimal Logo Template Pack",
    slug: "minimal-logo-template-pack",
    description: "50+ minimal logo templates perfect for startups and small businesses. Fully editable in Figma and Canva. Includes brand guidelines template.",
    price: 25000,
    currency: "UGX",
    type: ProductType.DIGITAL,
    status: ProductStatus.ACTIVE,
    thumbnailUrl: "/demo-logo-pack.png",
    fileUrl: null,
    fileName: "logo-templates.zip",
    fileSize: 15728640,
    venue: null,
    eventDate: null,
    capacity: null,
    ticketsSold: 0,
    views: 456,
    salesCount: 18,
    createdAt: "2025-09-10T10:00:00Z",
    updatedAt: "2026-02-28T14:00:00Z",
  },
  {
    id: "prod-2",
    creatorId: "creator-1",
    title: "Social Media Preset Bundle",
    slug: "social-media-preset-bundle",
    description: "100 Lightroom presets optimized for social media content. Includes warm, cool, vintage, and moody collections.",
    price: 15000,
    currency: "UGX",
    type: ProductType.DIGITAL,
    status: ProductStatus.ACTIVE,
    thumbnailUrl: "/demo-presets.png",
    fileUrl: null,
    fileName: "presets-bundle.zip",
    fileSize: 5242880,
    venue: null,
    eventDate: null,
    capacity: null,
    ticketsSold: 0,
    views: 312,
    salesCount: 24,
    createdAt: "2025-10-05T08:00:00Z",
    updatedAt: "2026-02-15T11:30:00Z",
  },
  {
    id: "prod-3",
    creatorId: "creator-2",
    title: "Afrobeat Sample Pack Vol.1",
    slug: "afrobeat-sample-pack-vol1",
    description: "Premium Afrobeat sample pack with 200+ loops, one-shots, and MIDI files. Compatible with all major DAWs.",
    price: 35000,
    currency: "UGX",
    type: ProductType.DIGITAL,
    status: ProductStatus.ACTIVE,
    thumbnailUrl: "/demo-afrobeat.png",
    fileUrl: null,
    fileName: "afrobeat-samples-vol1.zip",
    fileSize: 104857600,
    venue: null,
    eventDate: null,
    capacity: null,
    ticketsSold: 0,
    views: 678,
    salesCount: 35,
    createdAt: "2025-07-15T09:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "prod-4",
    creatorId: "creator-2",
    title: "Producer Starter Kit",
    slug: "producer-starter-kit",
    description: "Everything you need to start making beats. Includes drum kits, FX samples, and project templates for FL Studio.",
    price: 20000,
    currency: "UGX",
    type: ProductType.DIGITAL,
    status: ProductStatus.INACTIVE,
    thumbnailUrl: null,
    fileUrl: null,
    fileName: "producer-kit.zip",
    fileSize: 73400320,
    venue: null,
    eventDate: null,
    capacity: null,
    ticketsSold: 0,
    views: 234,
    salesCount: 12,
    createdAt: "2025-11-20T14:00:00Z",
    updatedAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "prod-5",
    creatorId: "creator-3",
    title: "Kampala Cultural Night",
    slug: "kampala-cultural-night",
    description: "An evening of traditional Ugandan dance, music, and cuisine at the National Theatre. Experience the rich cultural heritage of Uganda.",
    price: 50000,
    currency: "UGX",
    type: ProductType.EVENT,
    status: ProductStatus.ACTIVE,
    thumbnailUrl: "/demo-cultural-night.png",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    venue: "National Theatre, Kampala",
    eventDate: "2026-04-15T19:00:00Z",
    capacity: 200,
    ticketsSold: 87,
    views: 1200,
    salesCount: 87,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "prod-6",
    creatorId: "creator-3",
    title: "Creative Workshop: Digital Art",
    slug: "creative-workshop-digital-art",
    description: "Hands-on workshop learning digital art techniques. Bring your tablet or laptop. All skill levels welcome. Lunch provided.",
    price: 75000,
    currency: "UGX",
    type: ProductType.EVENT,
    status: ProductStatus.ACTIVE,
    thumbnailUrl: "/demo-workshop.png",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    venue: "Innovation Hub, Ntinda",
    eventDate: "2026-05-20T09:00:00Z",
    capacity: 30,
    ticketsSold: 18,
    views: 560,
    salesCount: 18,
    createdAt: "2026-02-01T12:00:00Z",
    updatedAt: "2026-03-02T16:00:00Z",
  },
];

// ── Mock Orders ────────────────────────────────────────────
const mockOrders: Order[] = [
  {
    id: "order-1",
    creatorId: "creator-1",
    productId: "prod-1",
    buyerEmail: "buyer1@example.com",
    buyerName: "John Mukasa",
    amount: 25000,
    platformFee: 2500,
    creatorEarning: 22500,
    currency: "UGX",
    status: OrderStatus.COMPLETED,
    paymentMethod: PaymentMethod.MTN_MOMO,
    pesapalOrderTrackingId: "mock-tracking-1",
    pesapalTransactionId: "mock-txn-1",
    downloadToken: "dl-token-1",
    createdAt: "2026-03-01T10:30:00Z",
    updatedAt: "2026-03-01T10:32:00Z",
  },
  {
    id: "order-2",
    creatorId: "creator-1",
    productId: "prod-2",
    buyerEmail: "buyer2@example.com",
    buyerName: "Grace Nakamya",
    amount: 15000,
    platformFee: 1500,
    creatorEarning: 13500,
    currency: "UGX",
    status: OrderStatus.COMPLETED,
    paymentMethod: PaymentMethod.AIRTEL_MONEY,
    pesapalOrderTrackingId: "mock-tracking-2",
    pesapalTransactionId: "mock-txn-2",
    downloadToken: "dl-token-2",
    createdAt: "2026-03-01T11:45:00Z",
    updatedAt: "2026-03-01T11:48:00Z",
  },
  {
    id: "order-3",
    creatorId: "creator-2",
    productId: "prod-3",
    buyerEmail: "buyer3@example.com",
    buyerName: "David Ochieng",
    amount: 35000,
    platformFee: 3500,
    creatorEarning: 31500,
    currency: "UGX",
    status: OrderStatus.COMPLETED,
    paymentMethod: PaymentMethod.MTN_MOMO,
    pesapalOrderTrackingId: "mock-tracking-3",
    pesapalTransactionId: "mock-txn-3",
    downloadToken: "dl-token-3",
    createdAt: "2026-02-28T14:20:00Z",
    updatedAt: "2026-02-28T14:23:00Z",
  },
  {
    id: "order-4",
    creatorId: "creator-3",
    productId: "prod-5",
    buyerEmail: "buyer4@example.com",
    buyerName: "Alice Nalubega",
    amount: 50000,
    platformFee: 5000,
    creatorEarning: 45000,
    currency: "UGX",
    status: OrderStatus.COMPLETED,
    paymentMethod: PaymentMethod.CARD,
    pesapalOrderTrackingId: "mock-tracking-4",
    pesapalTransactionId: "mock-txn-4",
    downloadToken: null,
    createdAt: "2026-02-27T09:10:00Z",
    updatedAt: "2026-02-27T09:15:00Z",
  },
  {
    id: "order-5",
    creatorId: "creator-1",
    productId: "prod-1",
    buyerEmail: "buyer5@example.com",
    buyerName: "Peter Wasswa",
    amount: 25000,
    platformFee: 2500,
    creatorEarning: 22500,
    currency: "UGX",
    status: OrderStatus.PENDING,
    paymentMethod: PaymentMethod.MTN_MOMO,
    pesapalOrderTrackingId: "mock-tracking-5",
    pesapalTransactionId: null,
    downloadToken: null,
    createdAt: "2026-03-02T08:00:00Z",
    updatedAt: "2026-03-02T08:00:00Z",
  },
  {
    id: "order-6",
    creatorId: "creator-2",
    productId: "prod-3",
    buyerEmail: "buyer6@example.com",
    buyerName: "Fatima Kamara",
    amount: 35000,
    platformFee: 3500,
    creatorEarning: 31500,
    currency: "UGX",
    status: OrderStatus.FAILED,
    paymentMethod: PaymentMethod.AIRTEL_MONEY,
    pesapalOrderTrackingId: "mock-tracking-6",
    pesapalTransactionId: null,
    downloadToken: null,
    createdAt: "2026-02-26T16:30:00Z",
    updatedAt: "2026-02-26T16:35:00Z",
  },
  {
    id: "order-7",
    creatorId: "creator-3",
    productId: "prod-5",
    buyerEmail: "buyer7@example.com",
    buyerName: "Robert Mugisha",
    amount: 50000,
    platformFee: 5000,
    creatorEarning: 45000,
    currency: "UGX",
    status: OrderStatus.COMPLETED,
    paymentMethod: PaymentMethod.MTN_MOMO,
    pesapalOrderTrackingId: "mock-tracking-7",
    pesapalTransactionId: "mock-txn-7",
    downloadToken: null,
    createdAt: "2026-02-25T12:00:00Z",
    updatedAt: "2026-02-25T12:05:00Z",
  },
  {
    id: "order-8",
    creatorId: "creator-1",
    productId: "prod-2",
    buyerEmail: "buyer8@example.com",
    buyerName: "Helen Auma",
    amount: 15000,
    platformFee: 1500,
    creatorEarning: 13500,
    currency: "UGX",
    status: OrderStatus.REFUNDED,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    pesapalOrderTrackingId: "mock-tracking-8",
    pesapalTransactionId: "mock-txn-8",
    downloadToken: null,
    createdAt: "2026-02-24T10:00:00Z",
    updatedAt: "2026-02-26T14:00:00Z",
  },
  {
    id: "order-9",
    creatorId: "creator-3",
    productId: "prod-6",
    buyerEmail: "buyer9@example.com",
    buyerName: "Samuel Kato",
    amount: 75000,
    platformFee: 7500,
    creatorEarning: 67500,
    currency: "UGX",
    status: OrderStatus.COMPLETED,
    paymentMethod: PaymentMethod.CARD,
    pesapalOrderTrackingId: "mock-tracking-9",
    pesapalTransactionId: "mock-txn-9",
    downloadToken: null,
    createdAt: "2026-02-20T15:00:00Z",
    updatedAt: "2026-02-20T15:05:00Z",
  },
  {
    id: "order-10",
    creatorId: "creator-2",
    productId: "prod-4",
    buyerEmail: "buyer10@example.com",
    buyerName: "Martha Nabbale",
    amount: 20000,
    platformFee: 2000,
    creatorEarning: 18000,
    currency: "UGX",
    status: OrderStatus.COMPLETED,
    paymentMethod: PaymentMethod.MTN_MOMO,
    pesapalOrderTrackingId: "mock-tracking-10",
    pesapalTransactionId: "mock-txn-10",
    downloadToken: "dl-token-10",
    createdAt: "2026-02-18T09:30:00Z",
    updatedAt: "2026-02-18T09:33:00Z",
  },
];

// ── Mock Donations ─────────────────────────────────────────
const mockDonations: Donation[] = [
  {
    id: "don-1",
    creatorId: "creator-1",
    donorEmail: "fan1@example.com",
    donorName: "Tom Byaruhanga",
    amount: 50000,
    message: "Love your work Sarah! Keep creating!",
    anonymous: false,
    createdAt: "2026-02-28T14:00:00Z",
  },
  {
    id: "don-2",
    creatorId: "creator-1",
    donorEmail: "fan2@example.com",
    donorName: "Anonymous",
    amount: 100000,
    message: "",
    anonymous: true,
    createdAt: "2026-02-25T10:30:00Z",
  },
  {
    id: "don-3",
    creatorId: "creator-3",
    donorEmail: "fan3@example.com",
    donorName: "Linda Atuhaire",
    amount: 75000,
    message: "Supporting cultural events in Uganda!",
    anonymous: false,
    createdAt: "2026-02-22T16:00:00Z",
  },
];

// ── Mock Withdrawals ───────────────────────────────────────
const mockWithdrawals: Withdrawal[] = [
  {
    id: "wd-1",
    creatorId: "creator-1",
    amount: 200000,
    status: WithdrawalStatus.COMPLETED,
    phoneNumber: "256700000001",
    provider: "MTN Mobile Money",
    createdAt: "2026-02-20T10:00:00Z",
    processedAt: "2026-02-20T12:00:00Z",
  },
  {
    id: "wd-2",
    creatorId: "creator-2",
    amount: 300000,
    status: WithdrawalStatus.PENDING,
    phoneNumber: "256700000002",
    provider: "Airtel Money",
    createdAt: "2026-03-01T08:00:00Z",
    processedAt: null,
  },
  {
    id: "wd-3",
    creatorId: "creator-1",
    amount: 150000,
    status: WithdrawalStatus.PROCESSING,
    phoneNumber: "256700000001",
    provider: "MTN Mobile Money",
    createdAt: "2026-03-02T09:00:00Z",
    processedAt: null,
  },
];

// ── Mock Tickets ───────────────────────────────────────────
const mockTickets: Ticket[] = [
  {
    id: "ticket-1",
    orderId: "order-4",
    productId: "prod-5",
    buyerEmail: "buyer4@example.com",
    buyerName: "Alice Nalubega",
    qrCode: "QR-MOCK-1",
    checkedIn: false,
    checkedInAt: null,
    createdAt: "2026-02-27T09:15:00Z",
  },
  {
    id: "ticket-2",
    orderId: "order-7",
    productId: "prod-5",
    buyerEmail: "buyer7@example.com",
    buyerName: "Robert Mugisha",
    qrCode: "QR-MOCK-2",
    checkedIn: true,
    checkedInAt: "2026-04-15T19:30:00Z",
    createdAt: "2026-02-25T12:05:00Z",
  },
  {
    id: "ticket-3",
    orderId: "order-9",
    productId: "prod-6",
    buyerEmail: "buyer9@example.com",
    buyerName: "Samuel Kato",
    qrCode: "QR-MOCK-3",
    checkedIn: false,
    checkedInAt: null,
    createdAt: "2026-02-20T15:05:00Z",
  },
];

// ── Mock Download Sessions ───────────────────────────────────
const mockDownloadSessions: DownloadSession[] = [];

// ── Generate Mock Page Views (last 30 days) ────────────────
function generateMockPageViews(): PageView[] {
  const views: PageView[] = [];
  const now = new Date();
  const creatorIds = ["creator-1", "creator-2", "creator-3"];
  const pages = ["store", "product"];

  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    views.push({
      id: `pv-${i + 1}`,
      creatorId: creatorIds[Math.floor(Math.random() * creatorIds.length)],
      page: pages[Math.floor(Math.random() * pages.length)],
      referrer: Math.random() > 0.5 ? "instagram.com" : Math.random() > 0.5 ? "twitter.com" : "direct",
      createdAt: date.toISOString(),
    });
  }

  return views.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const mockPageViews = generateMockPageViews();

// ── Generate sales-by-day data for analytics ───────────────
function generateSalesByDay(): { date: string; sales: number; revenue: number }[] {
  const data: { date: string; sales: number; revenue: number }[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    data.push({
      date: dateStr,
      sales: Math.floor(Math.random() * 8),
      revenue: Math.floor(Math.random() * 150000) + 5000,
    });
  }

  return data;
}

// ── Helper Functions ───────────────────────────────────────

export function getMockCreator(username: string): Creator | undefined {
  return mockCreators.find((c) => c.username === username);
}

export function getMockCreatorById(id: string): Creator | undefined {
  return mockCreators.find((c) => c.id === id);
}

export function getMockProducts(creatorId?: string): Product[] {
  if (creatorId) {
    return mockProducts.filter((p) => p.creatorId === creatorId);
  }
  return mockProducts;
}

export function getMockProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id);
}

export function getMockProductBySlug(creatorUsername: string, slug: string): Product | undefined {
  const creator = getMockCreator(creatorUsername);
  if (!creator) return undefined;
  return mockProducts.find((p) => p.creatorId === creator.id && p.slug === slug);
}

export function getMockOrders(creatorId: string): Order[] {
  return mockOrders.filter((o) => o.creatorId === creatorId);
}

export function getMockOrderById(id: string): Order | undefined {
  return mockOrders.find((o) => o.id === id);
}

export function getMockPageViews(creatorId?: string): PageView[] {
  if (creatorId) {
    return mockPageViews.filter((v) => v.creatorId === creatorId);
  }
  return mockPageViews;
}

export function getMockDonations(creatorId: string): Donation[] {
  return mockDonations.filter((d) => d.creatorId === creatorId);
}

export function getMockWithdrawals(creatorId: string): Withdrawal[] {
  return mockWithdrawals.filter((w) => w.creatorId === creatorId);
}

export function getMockTickets(productId?: string): Ticket[] {
  if (productId) {
    return mockTickets.filter((t) => t.productId === productId);
  }
  return mockTickets;
}

export function getMockDownloadSession(token: string): DownloadSession | undefined {
  return mockDownloadSessions.find(s => s.downloadToken === token);
}

export function getMockDownloadSessionByOrderId(orderId: string): DownloadSession | undefined {
  return mockDownloadSessions.find(s => s.orderId === orderId);
}

export function createMockDownloadSession(orderId: string, productId: string): DownloadSession {
  const session: DownloadSession = {
    id: `ds-${crypto.randomUUID()}`,
    orderId,
    productId,
    downloadToken: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    downloadCount: 0,
    maxDownloads: 5,
    lastDownloadedAt: null,
    createdAt: new Date().toISOString(),
  };
  mockDownloadSessions.push(session);
  return session;
}

export function getMockDashboardStats(creatorId: string): DashboardStats {
  const creator = getMockCreatorById(creatorId);
  const orders = getMockOrders(creatorId);

  return {
    totalRevenue: creator?.totalEarnings ?? 0,
    totalSales: creator?.totalSales ?? 0,
    balance: creator?.balance ?? 0,
    totalViews: creator?.totalViews ?? 0,
    recentOrders: orders.slice(0, 5),
    salesByDay: generateSalesByDay(),
  };
}

export function getMockStorePublicData(username: string): StorePublicData | undefined {
  const creator = getMockCreator(username);
  if (!creator) return undefined;

  const products = getMockProducts(creator.id).filter(
    (p) => p.status === ProductStatus.ACTIVE
  );

  return { creator, products };
}

// Check if a username is available (not taken by mock creators)
export function isMockUsernameAvailable(username: string): boolean {
  return !mockCreators.some((c) => c.username === username);
}

// ── Mock Passwords ─────────────────────────────────────────
const mockPasswords: Record<string, string> = {
  "creator-1": "sarah123",
  "creator-2": "james123",
  "creator-3": "nina123",
  "creator-admin": "Keeva#44",
};

export function getMockPassword(creatorId: string): string {
  return mockPasswords[creatorId] ?? "password123";
}

// ── Data Client Abstraction ────────────────────────────────
// Returns mock data when Supabase is not configured

export function isUsingMockData(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url === "mock" || url === "";
}

export { mockCreators, mockProducts, mockOrders, mockDonations, mockWithdrawals, mockTickets, mockDownloadSessions, mockPageViews };
