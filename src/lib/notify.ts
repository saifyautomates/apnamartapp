import { prisma } from "./prisma";
import type { NotificationChannel } from "@prisma/client";

// Notification abstraction: providers are pluggable. v1 ships a console provider
// (logs + stores the row) so no order flow ever depends on an SMS/WhatsApp vendor.
export interface NotificationProvider {
  send(channel: NotificationChannel, to: string, title: string, body: string): Promise<void>;
}

export const consoleNotificationProvider: NotificationProvider = {
  async send(channel, to, title, body) {
    console.log(`[notify:${channel}] to=${to} title=${title} body=${body}`);
  },
};

const ORDER_EVENT_TITLES: Record<string, string> = {
  ORDER_PLACED: "Order placed",
  ORDER_CONFIRMED: "Order confirmed",
  PACKED: "Order packed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Order cancelled",
  REFUND: "Refund processed",
};

export async function notifyUser(
  userId: string | null,
  type: string,
  title: string,
  body: string,
  channels: NotificationChannel[] = ["SMS", "WHATSAPP"],
  provider: NotificationProvider = consoleNotificationProvider,
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
}

export async function notifyOrderEvent(orderId: string, event: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const title = ORDER_EVENT_TITLES[event] ?? event;
  await notifyUser(order.userId, event, title, `Your order ${order.orderNumber} — ${title}.`, ["SMS", "WHATSAPP"]);
}
