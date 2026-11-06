// Delivery provider abstraction. v1 is store-handled (LocalDeliveryProvider).
// Shiprocket is a FUTURE adapter: its interface exists, but no integration,
// no credentials, and no shipment is created through it in v1.

export interface DeliveryProvider {
  createShipment(input: { orderId: string; address: unknown; weightGrams: number }): Promise<{ ok: boolean; shipmentId?: string; error?: string }>;
  trackShipment(shipmentId: string): Promise<{ ok: boolean; status?: string; error?: string }>;
  cancelShipment(shipmentId: string): Promise<{ ok: boolean; error?: string }>;
}

export class LocalDeliveryProvider implements DeliveryProvider {
  async createShipment(input: { orderId: string }) {
    return { ok: true, shipmentId: `LOCAL-${input.orderId}` };
  }
  async trackShipment(shipmentId: string) {
    return { ok: true, status: `Store-handled shipment ${shipmentId}` };
  }
  async cancelShipment() {
    return { ok: true };
  }
}

export class NotConfiguredShiprocketAdapter implements DeliveryProvider {
  private notConfigured() {
    return { ok: false, error: "SHIPROCKET_NOT_CONFIGURED" };
  }
  async createShipment() { return this.notConfigured(); }
  async trackShipment() { return this.notConfigured(); }
  async cancelShipment() { return this.notConfigured(); }
}

export function getDeliveryProvider(): DeliveryProvider {
  return new LocalDeliveryProvider();
}

export function getShiprocketStatus(): { connected: boolean; provider: string; reason: string } {
  return { connected: false, provider: "Shiprocket", reason: "Not configured in v1 (store handles delivery)" };
}
