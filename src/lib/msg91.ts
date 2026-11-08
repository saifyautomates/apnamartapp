/**
 * Production MSG91 Client for Central Mart India
 * Handles:
 * 1. SMS OTP Delivery via MSG91 OTP API v5
 * 2. WhatsApp Order & Dispatch Notifications via MSG91 WhatsApp v5
 * 3. Flow / Transactional Text SMS via MSG91 Flow API
 */

export interface Msg91OtpResponse {
  type: "success" | "error";
  message: string;
}

export interface Msg91WhatsAppResponse {
  status: "success" | "error";
  message?: string;
  data?: unknown;
}

function cleanIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Ensure starts with 91 for Indian mobile numbers
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

/**
 * 1. Send SMS OTP via MSG91 API v5
 */
export async function sendMsg91Otp(phone: string, otp: string): Promise<{ ok: boolean; message?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID || "CNTRLM";

  if (!authKey || authKey.startsWith("your_") || !templateId || templateId.startsWith("your_")) {
    console.log(`[msg91:mock-otp] Mobile: ${phone} | OTP: ${otp} (Set MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID in .env for real SMS)`);
    return { ok: true, message: "Mock OTP logged (configure MSG91 in .env for real SMS)" };
  }

  const mobile = cleanIndianPhone(phone);
  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", templateId);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("authkey", authKey);
  url.searchParams.set("otp", otp);
  if (senderId) url.searchParams.set("sender", senderId);

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const json = (await res.json().catch(() => ({}))) as Msg91OtpResponse;
    if (!res.ok || json.type === "error") {
      console.error("[msg91:otp-error]", json.message || res.statusText);
      return { ok: false, message: json.message || "Failed to deliver OTP via MSG91" };
    }

    return { ok: true, message: json.message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error during MSG91 OTP delivery";
    console.error("[msg91:otp-exception]", msg);
    return { ok: false, message: msg };
  }
}

/**
 * 2. Send WhatsApp Notification via MSG91 WhatsApp API v5
 */
export async function sendMsg91WhatsApp(opts: {
  phone: string;
  templateName: string;
  languageCode?: string;
  headerValues?: Record<string, string>;
  bodyValues?: Record<string, string>;
}): Promise<{ ok: boolean; message?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const integratedNumber = process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER;

  if (!authKey || authKey.startsWith("your_") || !integratedNumber) {
    console.log(`[msg91:mock-whatsapp] To: ${opts.phone} | Template: "${opts.templateName}"`);
    console.log(`[msg91:mock-whatsapp] Set MSG91_AUTH_KEY and MSG91_WHATSAPP_INTEGRATED_NUMBER in .env`);
    return { ok: true, message: "Mock WhatsApp logged" };
  }

  const mobile = cleanIndianPhone(opts.phone);
  const payload = {
    integrated_number: integratedNumber,
    content_type: "template",
    payload: {
      to: mobile,
      type: "template",
      template: {
        name: opts.templateName,
        language: {
          code: opts.languageCode || "en_US",
          policy: "deterministic",
        },
        components: [
          ...(opts.bodyValues
            ? [
                {
                  type: "body",
                  parameters: Object.entries(opts.bodyValues).map(([key, value]) => ({
                    type: "text",
                    text: value,
                  })),
                },
              ]
            : []),
        ],
      },
    },
  };

  try {
    const res = await fetch("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey,
      },
      body: JSON.stringify(payload),
    });

    const json = (await res.json().catch(() => ({}))) as Msg91WhatsAppResponse;
    if (!res.ok || json.status === "error") {
      console.error("[msg91:whatsapp-error]", json.message || res.statusText);
      return { ok: false, message: json.message || "Failed to send WhatsApp message via MSG91" };
    }

    return { ok: true, message: "WhatsApp message delivered" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "MSG91 WhatsApp exception";
    console.error("[msg91:whatsapp-exception]", msg);
    return { ok: false, message: msg };
  }
}

/**
 * 3. Send Transactional Text SMS via MSG91 Flow API
 */
export async function sendMsg91Sms(opts: {
  phone: string;
  flowId?: string;
  senderId?: string;
  message?: string;
  variables?: Record<string, string>;
}): Promise<{ ok: boolean; message?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const flowId = opts.flowId || process.env.MSG91_SMS_FLOW_ID;
  const senderId = opts.senderId || process.env.MSG91_SENDER_ID || "CNTRLM";

  if (!authKey || authKey.startsWith("your_")) {
    console.log(`[msg91:mock-sms] To: ${opts.phone} | Text: "${opts.message || JSON.stringify(opts.variables)}"`);
    return { ok: true, message: "Mock SMS logged" };
  }

  const mobile = cleanIndianPhone(opts.phone);

  try {
    // If flowId is provided, use Flow API (recommended for DLT in India)
    if (flowId) {
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: authKey,
        },
        body: JSON.stringify({
          template_id: flowId,
          sender: senderId,
          short_url: "0",
          mobiles: mobile,
          ...(opts.variables || {}),
        }),
      });

      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, message: json.message || "SMS dispatched" };
    }

    // Direct SMS fallback
    const url = new URL("https://control.msg91.com/api/sendhttp.php");
    url.searchParams.set("authkey", authKey);
    url.searchParams.set("mobiles", mobile);
    url.searchParams.set("message", opts.message || "");
    url.searchParams.set("sender", senderId);
    url.searchParams.set("route", "4");
    url.searchParams.set("country", "91");

    const res = await fetch(url.toString());
    return { ok: res.ok, message: await res.text() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "MSG91 SMS exception";
    console.error("[msg91:sms-exception]", msg);
    return { ok: false, message: msg };
  }
}

