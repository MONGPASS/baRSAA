/**
 * Demo mode — used for the static (backend-less) deployment.
 *
 * Enabled only when the build sets VITE_DEMO_MODE=1:
 *  - `npm run dev:mock` (via .env.mock)
 *  - Vercel (via vercel.json build env)
 *
 * The normal build (Cloudflare Worker + D1) leaves this off, so every real
 * API flow stays exactly as it was.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "1";

const ORDERS_KEY = "demo-orders";

export interface DemoOrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
}

export interface DemoOrder {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: DemoOrderItem[];
}

export function getDemoOrders(): DemoOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDemoOrder(order: DemoOrder): void {
  try {
    const orders = getDemoOrders();
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 20)));
  } catch (error) {
    console.error("Failed to save demo order:", error);
  }
}

export function getDemoOrder(id: number): DemoOrder | null {
  return getDemoOrders().find((o) => o.id === id) ?? null;
}

/** Sequential-looking order number for the demo. */
export function nextDemoOrderId(): number {
  const orders = getDemoOrders();
  const highest = orders.reduce((max, o) => Math.max(max, o.id), 1000);
  return highest + 1;
}
