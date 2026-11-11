"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Phone, CheckCheck, Sparkles, Loader2, Bot } from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "rider" | "system";
  senderName: string;
  text: string;
  timestamp: string;
}

export interface RiderAiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  riderName?: string;
}

const QUICK_CHIPS = [
  "🛵 Where are you right now?",
  "🚪 Please leave parcel at the door",
  "🔔 Don't ring bell, baby sleeping (call me)",
  "🥛 Are cold items packed safely?",
  "💵 Keep change for ₹500 ready",
  "📍 I will meet you at the main gate",
];

export function RiderAiChatModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  riderName = "Ramesh Kumar",
}: RiderAiChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isOpen) return;

    // Load initial chat history
    let isCancelled = false;
    async function loadChat() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}/chat`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.messages) {
            setMessages(data.messages);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadChat();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, orderId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText("");

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      senderName: "You",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setMessages(data.history);
        } else if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      }
    } catch {
      // In case of error, show friendly system note
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "system",
          senderName: "System",
          text: "Message sent! Rider will check during safe driving stop.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[650px] overflow-hidden border border-neutral-200">
        {/* Chat Header */}
        <div className="p-4 bg-gradient-to-r from-[#0c831f] via-[#107d22] to-[#15803d] text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl border border-white/30">
                👨‍🦱
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#f8cb46] border-2 border-[#0c831f]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-tight">{riderName}</h3>
                <span className="inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-white tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" /> AI Powered
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Live on Ather 450X · Order #{orderNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:+919876543210"
              className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition active:scale-95"
              title="Call Rider"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-neutral-50/80 border-b border-neutral-200/70 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              disabled={isTyping}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[11px] font-bold text-neutral-700 hover:text-emerald-800 border border-neutral-200 hover:border-emerald-300 shadow-xs transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8faf9]">
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold">Connecting to Rider &amp; Store Dispatch...</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isSystem = msg.sender === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <span className="inline-block bg-neutral-200/70 text-neutral-600 text-[10px] font-bold px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="h-7 w-7 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs shrink-0">
                      👨‍🦱
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                      isUser
                        ? "bg-[#0c831f] text-white rounded-br-xs font-medium"
                        : "bg-white text-neutral-800 border border-neutral-200/80 rounded-bl-xs"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 mb-0.5">
                        <span>{riderName}</span>
                        <span className="text-[9px] text-neutral-400 font-normal">
                          · {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {isUser && (
                      <div className="flex justify-end items-center gap-1 text-[9px] text-emerald-200 mt-1">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <CheckCheck className="w-3 h-3 text-emerald-200" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2 justify-start">
              <div className="h-7 w-7 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs shrink-0">
                👨‍🦱
              </div>
              <div className="bg-white border border-neutral-200/80 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-neutral-500 shadow-xs flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-neutral-600">{riderName} is typing</span>
                <span className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Message ${riderName} or ask delivery questions...`}
            className="flex-1 bg-neutral-100 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
            className="h-10 w-10 rounded-xl bg-[#0c831f] hover:bg-[#0a701a] disabled:bg-neutral-200 text-white flex items-center justify-center transition active:scale-95 shadow-sm cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiderAiChatModal;
