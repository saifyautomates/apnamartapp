import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_placeholder") || key === "your_resend_api_key_here") {
    return null;
  }
  resendClient = new Resend(key);
  return resendClient;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Sends a transactional email using Resend.
 * Gracefully falls back to console logger if RESEND_API_KEY is not yet configured.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
  const fromAddress = opts.from || process.env.RESEND_FROM_EMAIL || "Central Mart <orders@centralmart.in>";
  const client = getResend();

  if (!client) {
    console.log(`[resend:mock] To: ${Array.isArray(opts.to) ? opts.to.join(", ") : opts.to} | Subject: "${opts.subject}"`);
    console.log(`[resend:mock] Set RESEND_API_KEY in .env to deliver real emails.`);
    return { ok: true, id: `mock-${Date.now()}` };
  }

  try {
    const toRecipients = Array.isArray(opts.to) ? opts.to : [opts.to];
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: toRecipients,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    if (error) {
      console.error("[resend:error]", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send email via Resend";
    console.error("[resend:exception]", msg);
    return { ok: false, error: msg };
  }
}

// ============================================================================
// Premium Central Mart Branded Email Templates (Darkstore FMCG Quick-Commerce)
// ============================================================================

export function renderOrderConfirmationEmail(order: {
  orderNumber: string;
  customerName?: string | null;
  totalPaise: number;
  deliveryAddress?: string | null;
  deliveryMinutes?: number;
  items: Array<{ name: string; qty: number; lineTotalPaise: number }>;
}): string {
  const totalRupees = (order.totalPaise / 100).toFixed(2);
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #1c1c1c;">
          <strong>${item.name}</strong> × ${item.qty}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: bold; color: #1c1c1c; text-align: right;">
          ₹${(item.lineTotalPaise / 100).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Confirmed — Central Mart</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f7f9f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #0c831f, #0a6833); padding: 32px 28px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">CENTRAL MART</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 700; color: #fef08a; letter-spacing: 0.5px;">⚡ KOTA'S ONLINE FMCG SUPERMARKET</p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding: 32px 28px;">
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
            <p style="margin: 0; color: #15803d; font-size: 15px; font-weight: bold;">
              ✅ Order Confirmed: #${order.orderNumber}
            </p>
            <p style="margin: 6px 0 0 0; color: #166534; font-size: 13px;">
              Hello ${order.customerName || "Customer"}, your grocery order has been packed and scheduled for dispatch from our Kota darkstore.
            </p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <thead>
              <tr>
                <th style="padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; font-size: 12px; font-weight: 900; color: #6b7280; text-transform: uppercase; text-align: left;">Item</th>
                <th style="padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; font-size: 12px; font-weight: 900; color: #6b7280; text-transform: uppercase; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding-top: 14px; font-size: 16px; font-weight: 900; color: #1c1c1c;">Total Paid / COD</td>
                <td style="padding-top: 14px; font-size: 18px; font-weight: 900; color: #0c831f; text-align: right;">₹${totalRupees}</td>
              </tr>
            </tfoot>
          </table>

          ${
            order.deliveryAddress
              ? `<div style="background-color: #fafafa; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #f0f0f0;">
              <span style="font-size: 11px; font-weight: 900; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 4px;">📍 Delivering to:</span>
              <p style="margin: 0; font-size: 13px; color: #1c1c1c; font-weight: 600;">${order.deliveryAddress}</p>
            </div>`
              : ""
          }

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/orders" style="display: inline-block; background-color: #0c831f; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 900; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(12,131,31,0.25);">
              Track Order Live →
            </a>
          </div>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 20px 28px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af;">
          Central Mart Darkstore Operations, Nayapura, Kota, Rajasthan - 324001<br />
          Need help? WhatsApp support at <strong>+91 98765 43210</strong>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export function renderWelcomeEmail(name: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8" /></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f9fafb; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; border: 1px solid #e5e7eb;">
      <h2 style="color: #0c831f; margin-top: 0;">Welcome to Central Mart, ${name}!</h2>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">
        You're all set to experience Kota's fastest supermarket doorstep grocery delivery. Get 100% genuine FMCG products, dairy, staples, and daily essentials delivered in minutes.
      </p>
      <div style="background-color: #fef08a; padding: 12px; border-radius: 10px; margin: 20px 0; text-align: center;">
        <span style="font-size: 13px; font-weight: bold; color: #713f12;">🎁 Use code <strong>SAVE100</strong> for ₹100 OFF on your first grocery basket!</span>
      </div>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}" style="display: block; text-align: center; background: #0c831f; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: bold;">Start Shopping</a>
    </div>
  </body>
  </html>
  `;
}
