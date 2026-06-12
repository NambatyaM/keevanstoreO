// ============================================================
// WhatsApp Notification Utility
// Sends admin notifications via WhatsApp for contact form
// submissions and withdrawal requests
// ============================================================

const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP_NUMBER || "256768345905";
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY || "";

/**
 * Send a WhatsApp message to the admin using CallMeBot API.
 *
 * CallMeBot setup (one-time, takes 2 minutes):
 * 1. Open WhatsApp and send "I allow callmebot to send me messages" to +34 644 52 74 88
 * 2. You'll receive an API key back
 * 3. Add the API key to your .env as CALLMEBOT_APIKEY=your-key
 *
 * If CALLMEBOT_APIKEY is not set, notifications fall back to console.log only.
 * Messages are also always stored in Supabase regardless of WhatsApp delivery.
 */
export async function sendWhatsAppNotification(message: string): Promise<boolean> {
  // Always log to console as backup
  console.log(`📱 WhatsApp notification → ${ADMIN_WHATSAPP}:`);
  console.log(`   ${message.substring(0, 200)}${message.length > 200 ? "..." : ""}`);

  if (!CALLMEBOT_APIKEY) {
    console.log("   ⚠️ CALLMEBOT_APIKEY not set — WhatsApp notification skipped. Add it to .env to enable.");
    return false;
  }

  try {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_WHATSAPP}&text=${encodedMessage}&apikey=${CALLMEBOT_APIKEY}`;

    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      console.log("   ✅ WhatsApp notification sent successfully");
      return true;
    } else {
      const text = await response.text().catch(() => "unknown error");
      console.error(`   ❌ WhatsApp notification failed: ${response.status} — ${text}`);
      return false;
    }
  } catch (error) {
    // Don't throw — notifications are non-critical. The data is still in Supabase.
    console.error("   ❌ WhatsApp notification error:", error instanceof Error ? error.message : "unknown");
    return false;
  }
}

/**
 * Format and send a contact form notification via WhatsApp
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
 * Format and send a withdrawal request notification via WhatsApp
 */
export async function notifyWithdrawalRequest(data: {
  creatorName: string;
  creatorEmail: string;
  amount: number;
  phoneNumber: string;
  provider: string;
  withdrawalId: string;
}): Promise<void> {
  const formattedAmount = data.amount.toLocaleString("en-UG");

  const text = [
    "💰 *Withdrawal Request*",
    `*Creator:* ${data.creatorName}`,
    `*Email:* ${data.creatorEmail}`,
    `*Amount:* UGX ${formattedAmount}`,
    `*Send to:* ${data.phoneNumber} (${data.provider})`,
    `*Request ID:* ${data.withdrawalId}`,
    "",
    "Process from: keevanstore.in/admin",
  ].join("\n");

  await sendWhatsAppNotification(text);
}

/**
 * Format and send a new order notification via WhatsApp (optional — for high-value orders)
 */
export async function notifyNewOrder(data: {
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  amount: number;
  creatorName: string;
}): Promise<void> {
  const formattedAmount = data.amount.toLocaleString("en-UG");

  const text = [
    "🛒 *New Sale!*",
    `*Product:* ${data.productTitle}`,
    `*Buyer:* ${data.buyerName} (${data.buyerEmail})`,
    `*Amount:* UGX ${formattedAmount}`,
    `*Creator:* ${data.creatorName}`,
  ].join("\n");

  await sendWhatsAppNotification(text);
}
