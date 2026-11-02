/**
 * Pakasir QRIS helper.
 *
 * Primary: API v2
 *   POST https://app.pakasir.com/api/v2/create-transaction/{slug}/{order_id}
 *   Header: X-Api-Key
 *   Body: { method: 'qris', amount }
 *   Response: { txn_id, qr_string, total_payment, fee, expired_at, is_sandbox, ... }
 *
 *   GET https://app.pakasir.com/api/v2/transaction-status/{slug}/{txn_id}
 *
 * Fallback: API v1 (deprecated)
 *   POST https://app.pakasir.com/api/transactioncreate/qris
 *   GET  https://app.pakasir.com/api/transactiondetail
 */

const BASE = 'https://app.pakasir.com/api';

export interface PakasirCreds {
  slug: string;
  apiKey: string;
}

export interface PakasirQrisResult {
  ok: boolean;
  qrString: string | null;
  txnId: string | null;
  totalPayment: number | null;
  fee: number | null;
  expiredAt: string | null;
  isSandbox: boolean;
  version: 'v2' | 'v1' | null;
  error?: string;
  raw?: unknown;
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

function errMsg(json: any, text: string, status: number) {
  return (
    json?.message ||
    json?.error ||
    json?.msg ||
    `HTTP ${status}: ${text.substring(0, 150)}`
  );
}

/**
 * Create a QRIS transaction. Tries v2 first, then v1.
 */
export async function createPakasirQris(
  creds: PakasirCreds,
  orderId: string,
  amount: number
): Promise<PakasirQrisResult> {
  const empty: PakasirQrisResult = {
    ok: false, qrString: null, txnId: null, totalPayment: null,
    fee: null, expiredAt: null, isSandbox: false, version: null,
  };

  if (!creds.slug || !creds.apiKey) {
    return { ...empty, error: 'Slug atau API key Pakasir belum dikonfigurasi' };
  }

  const errors: string[] = [];

  // ---- v2 ----
  try {
    const url = `${BASE}/v2/create-transaction/${encodeURIComponent(creds.slug)}/${encodeURIComponent(orderId)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': creds.apiKey },
      body: JSON.stringify({ method: 'qris', amount: Math.round(amount) }),
      signal: AbortSignal.timeout(15000),
    });
    const { json, text } = await readJson(res);
    const d = json?.data ?? json; // tolerate wrapped response
    const qr = d?.qr_string || d?.payment_number || d?.payment?.payment_number;

    if (res.ok && qr) {
      return {
        ok: true,
        qrString: qr,
        txnId: d?.txn_id ?? null,
        totalPayment: d?.total_payment ?? null,
        fee: d?.fee ?? null,
        expiredAt: d?.expired_at ?? null,
        isSandbox: !!d?.is_sandbox,
        version: 'v2',
        raw: json,
      };
    }
    errors.push(`v2: ${errMsg(json, text, res.status)}`);
  } catch (e: any) {
    errors.push(`v2: ${e?.message || e}`);
  }

  // ---- v1 fallback ----
  try {
    const res = await fetch(`${BASE}/transactioncreate/qris`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: creds.slug,
        order_id: orderId,
        amount: Math.round(amount),
        api_key: creds.apiKey,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const { json, text } = await readJson(res);
    const p = json?.payment;
    if (res.ok && p?.payment_number) {
      return {
        ok: true,
        qrString: p.payment_number,
        txnId: null,
        totalPayment: p.total_payment ?? null,
        fee: p.fee ?? null,
        expiredAt: p.expired_at ?? null,
        isSandbox: false,
        version: 'v1',
        raw: json,
      };
    }
    errors.push(`v1: ${errMsg(json, text, res.status)}`);
  } catch (e: any) {
    errors.push(`v1: ${e?.message || e}`);
  }

  return { ...empty, error: errors.join(' | ') };
}

/**
 * Check whether a transaction is paid. Uses v2 if txnId known, else v1.
 */
export async function checkPakasirPaid(
  creds: PakasirCreds,
  opts: { txnId?: string | null; orderId: string; amount: number }
): Promise<{ paid: boolean; status: string | null; error?: string }> {
  const isPaid = (s: unknown) =>
    ['completed', 'paid', 'success', 'settlement'].includes(String(s || '').toLowerCase());

  // v2
  if (opts.txnId) {
    try {
      const url = `${BASE}/v2/transaction-status/${encodeURIComponent(creds.slug)}/${encodeURIComponent(opts.txnId)}`;
      const res = await fetch(url, {
        headers: { 'X-Api-Key': creds.apiKey },
        signal: AbortSignal.timeout(15000),
      });
      const { json } = await readJson(res);
      const d = json?.data ?? json;
      const status = d?.status ?? d?.transaction?.status ?? null;
      if (res.ok && status) return { paid: isPaid(status), status };
    } catch {
      // fall through to v1
    }
  }

  // v1
  try {
    const params = new URLSearchParams({
      project: creds.slug,
      amount: String(Math.round(opts.amount)),
      order_id: opts.orderId,
      api_key: creds.apiKey,
    });
    const res = await fetch(`${BASE}/transactiondetail?${params}`, {
      signal: AbortSignal.timeout(15000),
    });
    const { json } = await readJson(res);
    const status = json?.transaction?.status ?? json?.status ?? null;
    return { paid: isPaid(status), status };
  } catch (e: any) {
    return { paid: false, status: null, error: e?.message || String(e) };
  }
}

