#!/bin/bash
# ============================================
# Setup Digiflazz Proxy di VPS
# Jalankan: bash setup-proxy.sh
# ============================================

set -e

echo "🚀 Setup Digiflazz Proxy..."

# 1. Install Node.js 20
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js: $(node --version)"

# 2. Buat direktori proxy
echo "📁 Creating proxy directory..."
mkdir -p /opt/digiflazz-proxy
cd /opt/digiflazz-proxy

# 3. Buat package.json
cat > package.json << 'PKGJSON'
{
  "name": "digiflazz-proxy",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js" },
  "engines": { "node": ">=18" }
}
PKGJSON

# 4. Buat proxy server
cat > index.js << 'PROXYJS'
const http = require('http');
const PORT = process.env.PORT || 3000;
const SECRET = process.env.PROXY_SECRET || 'daya-proxy-secret-2026';

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, service: 'digiflazz-proxy', time: new Date().toISOString() }));
  }

  if (req.method !== 'POST' || !req.url?.startsWith('/proxy')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  const auth = req.headers['authorization'];
  if (SECRET && auth !== `Bearer ${SECRET}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let payload;
  try { payload = JSON.parse(body); } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON' }));
  }

  const { url, data } = payload;
  if (!url || !url.startsWith('https://api.digiflazz.com/')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Only Digiflazz URLs allowed' }));
  }

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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Digiflazz Proxy running on port ${PORT}`);
});
PROXYJS

# 5. Buat systemd service agar auto-start
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/digiflazz-proxy.service << 'SVCFILE'
[Unit]
Description=Digiflazz API Proxy
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/digiflazz-proxy
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
Environment=PORT=3000
Environment=PROXY_SECRET=daya-proxy-secret-2026

[Install]
WantedBy=multi-user.target
SVCFILE

# 6. Enable & start
systemctl daemon-reload
systemctl enable digiflazz-proxy
systemctl restart digiflazz-proxy

# 7. Cek status
sleep 2
echo ""
echo "============================================"
echo "✅ Proxy berhasil di-setup!"
echo "============================================"
echo "Status: $(systemctl is-active digiflazz-proxy)"
echo "URL: http://103.164.173.6:3000"
echo ""
echo "Test: curl http://103.164.173.6:3000"
echo ""
echo "Tambahkan env vars di Vercel:"
echo "  DIGIFLAZZ_PROXY_URL=http://103.164.173.6:3000"
echo "  DIGIFLAZZ_PROXY_SECRET=daya-proxy-secret-2026"
echo ""
echo "Whitelist IP di Digiflazz: 103.164.173.6"
echo "============================================"
