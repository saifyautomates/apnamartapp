"use client";

import { useEffect, useRef } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: "INSERT" | "UPDATE" | "DELETE" | "*";
  new: T;
  old: T;
}

export interface UseSupabaseRealtimeOptions {
  table: "Order" | "Inventory" | "ProductVariant" | "OrderStatusHistory" | "Payment";
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  onPayload: (payload: RealtimePayload) => void;
  enabled?: boolean;
}

/**
 * Universal Supabase Realtime hook.
 * Subscribes directly to PostgreSQL Change Data Capture (CDC) events via Supabase WebSockets.
 * Synchronizes frontend and backend instantly with auto-reconnection and zero polling overhead.
 */
export function useSupabaseRealtime({
  table,
  event = "*",
  filter,
  onPayload,
  enabled = true,
}: UseSupabaseRealtimeOptions) {
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let supabase: ReturnType<typeof createBrowserClient>;
    try {
      supabase = createBrowserClient();
    } catch {
      return;
    }

    const channelName = `realtime-cdc-${table}-${event}-${filter || "all"}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase.channel(channelName);

    const subscriptionConfig: {
      event: "INSERT" | "UPDATE" | "DELETE" | "*";
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema: "public",
      table,
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    channel
      .on("postgres_changes", subscriptionConfig, (payload: any) => {
        try {
          onPayloadRef.current({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        } catch (err) {
          console.warn(`[Supabase Realtime] Error handling ${table} event:`, err);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Connected cleanly to live database replication stream
        }
      });

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [table, event, filter, enabled]);
}
