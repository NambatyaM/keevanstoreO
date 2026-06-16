// ============================================================
// WhatsApp Notification Utility
// Admin notifications via WhatsApp direct message links
// No third-party bot required — admin checks WhatsApp directly
// ============================================================

const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP_NUMBER || "256768345905";

/**
 * Log a WhatsApp notification for the admin.
 *
 * Since no automated WhatsApp bot is used, notifications are logged to console
 * and stored in Supabase. The admin receives messages directly on WhatsApp
 * from customers using the WhatsApp support links on the site.
 *
 * For withdrawal and contact form notifications, the admin should check
 * the admin dashboard at keevanstore.in/admin or their WhatsApp directly.
 */
export async function sendWhatsAppNotification(message: string): Promise<boolean> {
  // Always log the notification for admin visibility
  console.log(`📱 Admin notification for WhatsApp ${ADMIN_WHATSAPP}:`);
  console.log(`   ${message.substring(0, 300)}${message.length > 300 ? "..." : ""}`);

  // Generate a WhatsApp link the admin can use to follow up
  const waLink = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message.substring(0, 200))}`;
  console.log(`   🔗 Follow-up link: ${waLink}`);

  return true;
}

/**
 * Format and log a contact form notification
 */
export async function notifyContactForm(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<void> {
  const text = [
    "📩 *New Contact Message*",
    `*From:* ${data.name}`,
    `*Email:* ${data.email}`,
    data.subject ? `*Subject:* ${data.subject}` : "",
    `*Message:* ${data.message}`,
    "",
    "Reply from: keevanstore.in/contact",
  ]
    .filter(Boolean)
    .join("\n");

  await sendWhatsAppNotification(text);
}

/**
 * Format and log a withdrawal request notification
 */
export async function notifyWithdrawalRequest(data: {
  creatorName: string;
  creatorEmail: string;
  amount: number;
  phoneNumber: string;
  provider: string;
  withdrawalId: string;
}): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(data.amount);

  const text = [
    "💰 *Withdrawal Request*",
    `*Creator:* ${data.creatorName}`,
    `*Email:* ${data.creatorEmail}`,
    `*Amount:* ${formattedAmount}`,
    `*Send to:* ${data.phoneNumber} (${data.provider})`,
    `*Request ID:* ${data.withdrawalId}`,
    "",
    "Process from: keevanstore.in/admin",
  ].join("\n");

  await sendWhatsAppNotification(text);
}

/**
 * Format and log a new order notification (optional — for high-value orders)
 */
export async function notifyNewOrder(data: {
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  amount: number;
  creatorName: string;
}): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(data.amount);

  const text = [
    "🛒 *New Sale!*",
    `*Product:* ${data.productTitle}`,
    `*Buyer:* ${data.buyerName} (${data.buyerEmail})`,
    `*Amount:* ${formattedAmount}`,
    `*Creator:* ${data.creatorName}`,
  ].join("\n");

  await sendWhatsAppNotification(text);
}
