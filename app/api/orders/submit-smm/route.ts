import { processSmm } from '@/lib/process-smm';
import { NextResponse } from 'next/server';

/**
 * POST /api/orders/submit-smm
 *
 * Manual trigger untuk mengirim order SMM ke SprintPedia.
 * Bisa dipanggil untuk retry order yang gagal.
 *
 * Body: { order_id: string }
 */
export async function POST(req: Request) {
  const { order_id } = await req.json();
  if (!order_id) {
    return NextResponse.json({ error: 'order_id wajib' }, { status: 400 });
  }

  const result = await processSmm(order_id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    provider_ref: result.provider_ref,
    message: `Order berhasil dikirim ke SprintPedia (ID: ${result.provider_ref})`,
  });
}
