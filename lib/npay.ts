/**
 * NPay QRIS helper.
 *
 * Generate QRIS:
 *   POST https://npay.nidalop.my.id/api/app/qris/:qris_id/invoice
 *   Headers: X-License-Key, X-Webhook-Secret, Content-Type: application/json
 *   Body: { amount, sumber }
 *   Response: { ok, data: { transaction: {...}, qr_image, qr_string } }
 *
 * Check status:
 *   GET https://npay.nidalop.my.id/api/app/transactions/:id/status
 *
 * List QRIS:
 *   GET https://npay.nidalop.my.id/api/app/qris
 */

import crypto from 'crypto';

const BASE = 'https://npay.nidalop.my.id/api/app';

export interface NPayCreds {
  licenseKey: string;
  webhookSecret: string;
  qrisId: string;
}

export interface NPayQrisResult {
  ok: boolean;
  qrString: string | null;
  qrImage: string | null;
  txnId: string | null;
  totalPayment: number | null;
  baseAmount: number | null;
  fee: number | null;
  expiredAt: string | null;
  sumber: string | null;
  error?: string;
  raw?: unknown;
}

function headers(creds: NPayCreds): Record<string, string> {
  return {
    'X-License-Key': creds.licenseKey,
    'X-Webhook-Secret': creds.webhookSecret,
    'Content-Type': 'application/json',
  };
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

/**
 * Create a QRIS invoice via NPay.
 */
export async function createNPayQris(
  creds: NPayCreds,
  orderId: string,
  amount: number
): Promise<NPayQrisResult> {
  const empty: NPayQrisResult = {
    ok: false, qrString: null, qrImage: null, txnId: null,
    totalPayment: null, baseAmount: null, fee: null,
    expiredAt: null, sumber: null,
  };

  if (!creds.licenseKey || !creds.webhookSecret || !creds.qrisId) {
    return { ...empty, error: 'License Key, Webhook Secret, atau QRIS ID NPay belum dikonfigurasi' };
  }

  const sumber = `dayamart-${orderId}`;

  try {
    const url = `${BASE}/qris/${encodeURIComponent(creds.qrisId)}/invoice`;
    const res = await fetch(url, {
      method: 'POST',
      headers: headers(creds),
      body: JSON.stringify({ amount: Math.round(amount), sumber }),
      signal: AbortSignal.timeout(15000),
    });

    const { json, text } = await readJson(res);

    if (!res.ok) {
      const errMsg = json?.error || `HTTP ${res.status}: ${text.substring(0, 150)}`;
      return { ...empty, error: errMsg, raw: json };
    }

    if (!json?.ok || !json?.data) {
      return { ...empty, error: json?.error || 'Response tidak valid dari NPay', raw: json };
    }

    const d = json.data;
    const txn = d.transaction || {};

    return {
      ok: true,
      qrString: d.qr_string || null,
      qrImage: d.qr_image || null,
      txnId: txn.id || null,
      totalPayment: txn.amount ?? null,
      baseAmount: txn.base_amount ?? null,
      fee: txn.fee_amount ?? null,
      expiredAt: txn.expires_at ?? null,
      sumber: txn.sumber_order ?? sumber,
      raw: json,
    };
  } catch (e: any) {
    return { ...empty, error: e?.message || String(e) };
  }
}

/**
 * Check whether a transaction is paid via NPay.
 */
export async function checkNPayPaid(
  creds: NPayCreds,
  txnId: string
): Promise<{ paid: boolean; status: string | null; paidAt: string | null; error?: string }> {
  if (!txnId) {
    return { paid: false, status: null, paidAt: null, error: 'txnId kosong' };
  }

  try {
    const url = `${BASE}/transactions/${encodeURIComponent(txnId)}/status`;
    const res = await fetch(url, {
      headers: {
        'X-License-Key': creds.licenseKey,
        'X-Webhook-Secret': creds.webhookSecret,
      },
      signal: AbortSignal.timeout(15000),
    });

    const { json } = await readJson(res);

    if (!res.ok) {
      return { paid: false, status: null, paidAt: null, error: json?.error || `HTTP ${res.status}` };
    }

    const d = json?.data || {};
    const status = d.status || null;
    return {
      paid: status === 'paid',
      status,
      paidAt: d.paid_at || null,
    };
  } catch (e: any) {
    return { paid: false, status: null, paidAt: null, error: e?.message || String(e) };
  }
}

/**
 * List QRIS devices owned by the account.
 */
export async function listNPayQris(creds: NPayCreds) {
  try {
    const res = await fetch(`${BASE}/qris`, {
      headers: {
        'X-License-Key': creds.licenseKey,
        'X-Webhook-Secret': creds.webhookSecret,
      },
      signal: AbortSignal.timeout(15000),
    });
    const { json } = await readJson(res);
    return { ok: res.ok, data: json, error: res.ok ? null : (json?.error || `HTTP ${res.status}`) };
  } catch (e: any) {
    return { ok: false, data: null, error: e?.message || String(e) };
  }
}

/**
 * Verify NPay webhook signature (HMAC-SHA256).
 */
export function verifyNPaySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return signature === expected;
}

