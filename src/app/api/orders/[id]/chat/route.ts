import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccess } from "@/lib/auth";

export const runtime = "nodejs";

interface ChatMessage {
  id: string;
  sender: "user" | "rider" | "system";
  senderName: string;
  text: string;
  timestamp: string;
}

// In-memory conversation store for active order sessions
const orderChatHistory = new Map<string, ChatMessage[]>();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, delivery: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const riderName = order.delivery?.assignedTo || "Ramesh Kumar";
    const history = orderChatHistory.get(orderId) || [
      {
        id: "msg-welcome-0",
        sender: "rider",
        senderName: riderName,
        text: `Namaste! 🙏 Main ${riderName}, aapka Central Mart express delivery partner. Aapka order #${order.orderNumber} humare 80 Feet Road Dark Store se dispatch ho raha hai. Agar koi landmark ya delivery instruction ho toh yahan batayein!`,
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ success: true, messages: history, riderName });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load chat" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const body = await req.json().catch(() => ({}));
    const messageText = (body.message || "").trim();

    if (!messageText) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, delivery: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const riderName = order.delivery?.assignedTo || "Ramesh Kumar";
    const itemSummary = order.items.map((i) => `${i.qty}x ${i.productName}`).join(", ");
    const address = (order.delivery?.addressSnapshot as any)?.line1 || "Kota Doorstep";
    const status = order.status;

    // Build chat history list
    let history = orderChatHistory.get(orderId) || [
      {
        id: "msg-welcome-0",
        sender: "rider",
        senderName: riderName,
        text: `Namaste! 🙏 Main ${riderName}, aapka Central Mart delivery partner. Aapka order #${order.orderNumber} dispatch ho raha hai!`,
        timestamp: new Date().toISOString(),
      },
    ];

    // Push User Message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      senderName: "You",
      text: messageText,
      timestamp: new Date().toISOString(),
    };
    history.push(userMsg);

    // Generate AI response via Gemini API or Conversational Engine
    let aiReply = "";
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const systemPrompt = `You are ${riderName}, a courteous, quick, and helpful delivery partner for Central Mart (Kota's premier online grocery store located at 80 Feet Road).
You are currently delivering order #${order.orderNumber} on an electric scooter (Ather 450X RJ-20-CM-8821).
Order Details:
- Items in package: ${itemSummary}
- Delivery Address: ${address}
- Current Order Status: ${status}
- Temperature & Hygiene: Thermal cooler bag, 100% vaccinated, clean parcel seal intact.

Rules:
1. Speak in friendly, polite, conversational Indian English or natural Hinglish (e.g. "Sure bhaiya", "Bas 5 minute me pahuch raha hu", "Chinta mat kijiye, packaging bilkul safe hai").
2. Answer customer questions about order ETA, items, cold storage, packaging, or special delivery instructions (e.g. don't ring bell, leave at guard, bring change for cash).
3. Keep responses short and realistic (1-3 sentences), exactly like a real delivery rider messaging on Blinkit, Zepto, or Swiggy Instamart.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `${systemPrompt}\n\nCustomer asks: "${messageText}"`,
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: 120,
                temperature: 0.7,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidateText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidateText) {
            aiReply = candidateText;
          }
        }
      } catch {
        /* fallback to internal engine if network/key issues */
      }
    }

    // High-fidelity fallback conversational engine if Gemini is not set or failed
    if (!aiReply) {
      const lower = messageText.toLowerCase();

      if (
        lower.includes("where") ||
        lower.includes("kaha") ||
        lower.includes("eta") ||
        lower.includes("time") ||
        lower.includes("late") ||
        lower.includes("kab") ||
        lower.includes("der")
      ) {
        if (status === "DELIVERED") {
          aiReply = `Bhaiya, aapka order delivered ho chuka hai! Please check your doorstep. Agar koi issue ho toh Central Mart support par call kar sakte hain. Thank you! 🙏`;
        } else if (status === "OUT_FOR_DELIVERY") {
          aiReply = `Haan ji! Main aapke area ke paas hi hu, bas 5-8 minute me aapke address (${address}) par deliver kar dunga. Live location map par track kar sakte hain! 🛵`;
        } else {
          aiReply = `Aapka order Dark Store par pack ho chuka hai (${itemSummary}). Bas 2 minute me rider handover hokar nikal raha hu! ⚡`;
        }
      } else if (
        lower.includes("bell") ||
        lower.includes("ghanti") ||
        lower.includes("baby") ||
        lower.includes("sleeping") ||
        lower.includes("ring") ||
        lower.includes("call")
      ) {
        aiReply = `Bilkul note kar liya hai sir! Doorbell nahi bajaunga, aate hi aapko direct phone call kar dunga. 👍`;
      } else if (
        lower.includes("door") ||
        lower.includes("gate") ||
        lower.includes("guard") ||
        lower.includes("security") ||
        lower.includes("chhod") ||
        lower.includes("rakh")
      ) {
        aiReply = `Theek hai bhaiya! Parcel gate/guard ke paas safely drop karke photo update kar dunga. Thank you! 📦`;
      } else if (
        lower.includes("cold") ||
        lower.includes("milk") ||
        lower.includes("ice") ||
        lower.includes("curd") ||
        lower.includes("dahi") ||
        lower.includes("butter") ||
        lower.includes("dairy")
      ) {
        aiReply = `Haanji, saare dairy and cold items insulated thermal bag me pack hain ice-packs ke saath. Bilkul fresh milenge aapko! 🥛🧊`;
      } else if (
        lower.includes("change") ||
        lower.includes("cash") ||
        lower.includes("500") ||
        lower.includes("upi") ||
        lower.includes("khulle")
      ) {
        aiReply = `Ji bhaiya, mere paas change bhi available hai aur main UPI QR scanner bhi carry kar raha hu (PhonePe/GPay). Dono chalega! 💳`;
      } else if (
        lower.includes("pack") ||
        lower.includes("item") ||
        lower.includes("check") ||
        lower.includes("bhul") ||
        lower.includes("saare")
      ) {
        aiReply = `Ji, barcode scanner se saare items check kiye gaye hain: ${itemSummary}. Seal-packed grocery bag hai.`;
      } else if (lower.includes("hi") || lower.includes("hello") || lower.includes("namaste") || lower.includes("bhai")) {
        aiReply = `Hello! Haanji bataiye, delivery ke regarding koi landmark ya help chahiye? Main on-duty hu. 😊`;
      } else if (lower.includes("thank") || lower.includes("dhanyawad") || lower.includes("ok") || lower.includes("accha")) {
        aiReply = `You're welcome! Bas kuch hi minute me milte hain. Khushiyan aur taaza rashan deliver karna humara kaam hai! 🙏`;
      } else {
        aiReply = `Noted bhaiya! Maine instructions dekh li hain aur safe same-day delivery ensure karunga. Any other help? 🛵`;
      }
    }

    const riderMsg: ChatMessage = {
      id: `msg-rider-${Date.now()}`,
      sender: "rider",
      senderName: riderName,
      text: aiReply,
      timestamp: new Date().toISOString(),
    };
    history.push(riderMsg);

    // Keep history capped at last 50 messages per order
    if (history.length > 50) {
      history = history.slice(-50);
    }
    orderChatHistory.set(orderId, history);

    return NextResponse.json({
      success: true,
      reply: aiReply,
      message: riderMsg,
      history,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Chat failed" }, { status: 500 });
  }
}

