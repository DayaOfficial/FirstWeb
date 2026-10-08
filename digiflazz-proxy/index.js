/**
 * Digiflazz Proxy — Deploy di Railway.app untuk IP tetap.
 * 
 * Semua request ke Digiflazz API dikirim lewat proxy ini.
 * Whitelist IP Railway di dashboard Digiflazz.
 * 
 * Env vars yang dibutuhkan:
 * - PROXY_SECRET: Secret token untuk autentikasi (samakan di Daya Mart)
 * - PORT: Port (default 3000, Railway set otomatis)
 */
const http = require('http');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.PROXY_SECRET || '';

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Health check
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, service: 'digiflazz-proxy' }));
  }

  // Hanya terima POST /proxy
  if (req.method !== 'POST' || !req.url?.startsWith('/proxy')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  // Auth check
  const auth = req.headers['authorization'];
  if (SECRET && auth !== `Bearer ${SECRET}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }

  // Parse body
  let body = '';
  for await (const chunk of req) body += chunk;

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON' }));
  }

  const { url, data } = payload;

  // Validate target URL must be digiflazz
  if (!url || !url.startsWith('https://api.digiflazz.com/')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Only Digiflazz URLs allowed' }));
  }

  // Forward ke Digiflazz
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const text = await resp.text();
    res.writeHead(resp.status, { 'Content-Type': 'application/json' });
    res.end(text);
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Digiflazz Proxy running on port ${PORT}`);
});
