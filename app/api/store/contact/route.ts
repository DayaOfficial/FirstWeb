import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/server-config';

/**
 * GET /api/store/contact
 * Public endpoint — returns owner WA number for post-payment contact.
 * Only exposes owner_wa, nothing else.
 */
export async function GET() {
  const m = await getSettings(['owner_wa', 'store_name']);
  return NextResponse.json({
    owner_wa: m.owner_wa || '',
    store_name: m.store_name || 'DAYA MART',
  });
}
