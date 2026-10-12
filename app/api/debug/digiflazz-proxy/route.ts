import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDigiflazz } from '@/lib/server-config';

export async function GET() {
  const results: Record<string, unknown>[] = [];
  const cfg = await getDigiflazz();
  const proxyUrl = process.env.DIGIFLAZZ_PROXY_URL || '';
  const proxySecret = process.env.DIGIFLAZZ_PROXY_SECRET || '';

  results.push({
    step: 'ENV',
    username: cfg.username ? cfg.username.substring(0, 4) + '***' : 'KOSONG',
    apiKey: cfg.apiKey ? cfg.apiKey.substring(0, 8) + '***' : 'KOSONG',
    prodKey: cfg.prodKey ? cfg.prodKey.substring(0, 8) + '***' : 'KOSONG',
    proxyUrl: proxyUrl || 'TIDAK ADA',
    proxySecret: proxySecret ? 'SET' : 'KOSONG',
    testing: process.env.DIGIFLAZZ_TESTING,
  });

  // Test 1: Proxy health check
  if (proxyUrl) {
    try {
      const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
      const t = await r.text();
      results.push({ step: 'PROXY_HEALTH', status: r.status, body: t.substring(0, 200) });
    } catch (e: unknown) {
      results.push({ step: 'PROXY_HEALTH', error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Test 2: Cek saldo via proxy
  if (proxyUrl && cfg.username && cfg.readKeys.length) {
    const sign = crypto.createHash('md5').update(cfg.username + cfg.readKeys[0] + 'depo').digest('hex');
    try {
      const r = await fetch(`${proxyUrl}/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${proxySecret}` },
        body: JSON.stringify({
          url: 'https://api.digiflazz.com/v1/cek-saldo',
          data: { cmd: 'deposit', username: cfg.username, sign },
        }),
        signal: AbortSignal.timeout(15000),
      });
      const t = await r.text();
      results.push({ step: 'SALDO_VIA_PROXY', status: r.status, body: t.substring(0, 300) });
    } catch (e: unknown) {
      results.push({ step: 'SALDO_VIA_PROXY', error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Test 3: Cek saldo DIRECT (tanpa proxy)
  if (cfg.username && cfg.readKeys.length) {
    const sign = crypto.createHash('md5').update(cfg.username + cfg.readKeys[0] + 'depo').digest('hex');
    try {
      const r = await fetch('https://api.digiflazz.com/v1/cek-saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: 'deposit', username: cfg.username, sign }),
        signal: AbortSignal.timeout(10000),
      });
      const t = await r.text();
      results.push({ step: 'SALDO_DIRECT', status: r.status, body: t.substring(0, 300) });
    } catch (e: unknown) {
      results.push({ step: 'SALDO_DIRECT', error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ results });
}
