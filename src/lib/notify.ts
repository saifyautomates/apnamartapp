import { prisma } from "./prisma";
import type { NotificationChannel } from "@prisma/client";
import { sendMsg91Sms, sendMsg91WhatsApp } from "./msg91";
import { sendEmail, renderOrderConfirmationEmail } from "./resend";

export interface NotificationProvider {
  send(channel: NotificationChannel, to: string, title: string, body: string, metadata?: Record<string, unknown>): Promise<void>;
}

export const multiChannelNotificationProvider: NotificationProvider = {
  async send(channel, to, title, body, metadata = {}) {
    if (channel === "SMS") {
      const flowId = process.env.MSG91_SMS_FLOW_ID;
      await sendMsg91Sms({
        phone: to,
        flowId,
        message: `${title}: ${body}`,
        variables: {
          title,
          body,
          ...(metadata as Record<string, string>),
        },
      });
      return;
    }

    if (channel === "WHATSAPP") {
      const templateName = process.env.MSG91_WHATSAPP_ORDER_TEMPLATE || "centralmart_order_update";
      await sendMsg91WhatsApp({
        phone: to,
        templateName,
        bodyValues: {
          title,
          body,
          ...(metadata as Record<string, string>),
        },
      });
      return;
    }

    console.log(`[notify:${channel}] to=${to} title=${title} body=${body}`);
  },
};

const ORDER_EVENT_TITLES: Record<string, string> = {
  ORDER_PLACED: "Order Placed Successfully",
  ORDER_CONFIRMED: "Order Confirmed by Darkstore",
  PACKED: "Groceries Packed & Ready",
  OUT_FOR_DELIVERY: "Rider Out For Delivery",
  DELIVERED: "Order Delivered Safely",
  CANCELLED: "Order Cancelled",
  REFUND: "Refund Credited",
};

export async function notifyUser(
  userId: string | null,
  type: string,
  title: string,
  body: string,
  channels: NotificationChannel[] = ["SMS", "WHATSAPP"],
  provider: NotificationProvider = multiChannelNotificationProvider,
): Promise<void> {
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  for (const channel of channels) {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_channel: { userId, channel } },
    });
    if (pref && !pref.enabled) continue;

    const row = await prisma.notification.create({
      data: { userId, type, channel, title, body, status: "QUEUED" },
    });

    try {
      await provider.send(channel, user.phone, title, body);
      await prisma.notification.update({ where: { id: row.id }, data: { status: "SENT", sentAt: new Date() } });
    } catch (err) {
      await prisma.notification.update({
        where: { id: row.id },
        data: { status: "FAILED", data: { error: err instanceof Error ? err.message : "send failed" } },
      });
    }
  }

  // Also dispatch transactional email via Resend if user has an email
  if (user.email && (type === "ORDER_PLACED" || type === "DELIVERED")) {
    try {
      await sendEmail({
        to: user.email,
        subject: `${title} — Central Mart Order Update`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #0c831f;">${title}</h2>
          <p>${body}</p>
          <p>Thank you for shopping with Central Mart Kota.</p>
        </div>`,
      });
    } catch {
      /* ignore email failure */
    }
  }
}

export async function notifyOrderEvent(orderId: string, event: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true,
    },
  });
  if (!order) return;

  const title = ORDER_EVENT_TITLES[event] ?? event;
  const bodyText = `Your Central Mart order #${order.orderNumber} is now: ${title}. Fast delivery right to your doorstep.`;

  // 1. Send SMS & WhatsApp notifications
  await notifyUser(order.userId, event, title, bodyText, ["SMS", "WHATSAPP"]);

  // 2. Send rich HTML invoice confirmation email via Resend
  if (event === "ORDER_PLACED" && order.user?.email) {
    const addr = order.addressSnapshot as { line1?: string; city?: string; pincode?: string } | null;
    const deliveryAddress = addr ? `${addr.line1 || ""}, ${addr.city || "Kota"} - ${addr.pincode || "324001"}` : undefined;

    const html = renderOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      totalPaise: order.grandTotalPaise,
      deliveryAddress,
      items: order.items.map((it) => ({
        name: it.productName || it.variantName,
        qty: it.qty,
        lineTotalPaise: it.totalPaise,
      })),
    });

    await sendEmail({
      to: order.user.email,
      subject: `Order Confirmed: #${order.orderNumber} — Central Mart Kota`,
      html,
    });
  }
}
