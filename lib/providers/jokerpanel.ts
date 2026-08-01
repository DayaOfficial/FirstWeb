const BASE = process.env.JOKERPANEL_BASE_URL ?? 'https://jokerpanel.com/api/v2';

async function call(payload: Record<string, unknown>) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: process.env.JOKERPANEL_API_KEY, ...payload }),
  });
  return res.json();
}

/** Ambil semua layanan yang tersedia */
export async function getServices(): Promise<JokerService[]> {
  return call({ action: 'services' }) as Promise<JokerService[]>;
}

/** Kirim order SMM */
export async function addOrder(service: number, link: string, quantity: number) {
  return call({ action: 'add', service, link, quantity }) as Promise<{ order: number }>;
}

/** Cek status order */
export async function getOrderStatus(order: number) {
  return call({ action: 'status', order }) as Promise<JokerOrderStatus>;
}

// === Types ===

export interface JokerService {
  service: number;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
  category: string;
}

export interface JokerOrderStatus {
  order: number;
  status: 'Pending' | 'In progress' | 'Completed' | 'Partial' | 'Canceled';
  charge: string;
  start_count: string;
  remains: string;
  currency: string;
}
