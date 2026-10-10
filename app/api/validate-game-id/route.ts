import { NextResponse } from 'next/server';

/**
 * POST /api/validate-game-id
 * Validasi ID game dan return username.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { game_key, fields } = body;

  if (!game_key || !fields) {
    return NextResponse.json({ valid: false, error: 'Data tidak lengkap' }, { status: 400 });
  }

  try {
    let result: { valid: boolean; username?: string; error?: string };

    switch (game_key) {
      case 'mobile_legends':
        result = await validateMobileLegends(fields.user_id, fields.zone_id);
        break;
      case 'free_fire':
        result = await validateFreeFire(fields.player_id);
        break;
      case 'genshin_impact':
        result = validateGenshin(fields.uid);
        break;
      case 'honkai_star_rail':
        result = validateHSR(fields.uid);
        break;
      case 'pubg_mobile':
        result = validatePUBG(fields.player_id);
        break;
      case 'higgs_domino':
        result = validateHiggs(fields.player_id);
        break;
      case 'codm':
        result = validateCODM(fields.player_id);
        break;
      case 'valorant':
        result = validateValorant(fields.riot_id, fields.riot_tag);
        break;
      case 'steam_wallet':
        result = validateSteam(fields.email);
        break;
      default:
        result = validateBasic(Object.values(fields).join(''));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[validate-game-id] Error:', err);
    return NextResponse.json({ valid: false, error: 'Gagal memvalidasi. Coba lagi.' });
  }
}

// ──── Mobile Legends ────
async function validateMobileLegends(userId: string, zoneId: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  if (!userId || !zoneId) return { valid: false, error: 'User ID dan Zone ID wajib diisi' };
  userId = userId.trim();
  zoneId = zoneId.trim();
  if (!/^\d+$/.test(userId)) return { valid: false, error: 'User ID harus berupa angka' };
  if (!/^\d+$/.test(zoneId)) return { valid: false, error: 'Zone ID harus berupa angka' };
  if (userId.length < 6 || userId.length > 12) return { valid: false, error: 'User ID harus 6-12 digit' };
  if (zoneId.length < 1 || zoneId.length > 5) return { valid: false, error: 'Zone ID harus 1-5 digit' };

  // Try validation APIs
  const apis = [
    { url: `https://api.isan.eu.org/nickname/ml?id=${userId}&zone=${zoneId}`, parse: (d: any) => d?.username || d?.name || d?.result?.username },
    { url: `https://api.cek.my.id/ml?id=${userId}&zone=${zoneId}`, parse: (d: any) => d?.username || d?.data?.username || d?.name },
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api.url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) continue;
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { continue; }

      const username = api.parse(data);
      if (username && typeof username === 'string' && username.length > 0 && username.toLowerCase() !== 'null' && username.toLowerCase() !== 'undefined') {
        return { valid: true, username };
      }

      // API returned successfully but no username → account not found
      if (data && (data.status === false || data.success === false || data.error)) {
        return { valid: false, error: 'Akun Mobile Legends tidak ditemukan. Periksa User ID dan Zone ID.' };
      }
    } catch {
      continue;
    }
  }

  // Semua API gagal → TOLAK (ketat) dan minta user coba lagi
  return { valid: false, error: 'Tidak dapat memvalidasi akun saat ini. Periksa ID atau coba lagi.' };
}

// ──── Free Fire ────
async function validateFreeFire(playerId: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  if (!playerId) return { valid: false, error: 'Player ID wajib diisi' };
  playerId = playerId.trim();
  if (!/^\d+$/.test(playerId)) return { valid: false, error: 'Player ID harus berupa angka' };
  if (playerId.length < 6 || playerId.length > 12) return { valid: false, error: 'Player ID harus 6-12 digit' };

  const apis = [
    { url: `https://api.isan.eu.org/nickname/ff?id=${playerId}`, parse: (d: any) => d?.username || d?.name || d?.result?.username },
    { url: `https://api.cek.my.id/ff?id=${playerId}`, parse: (d: any) => d?.username || d?.data?.username || d?.name },
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api.url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) continue;
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { continue; }

      const username = api.parse(data);
      if (username && typeof username === 'string' && username.length > 0 && username.toLowerCase() !== 'null') {
        return { valid: true, username };
      }

      if (data && (data.status === false || data.success === false || data.error)) {
        return { valid: false, error: 'Akun Free Fire tidak ditemukan. Periksa Player ID.' };
      }
    } catch {
      continue;
    }
  }

  return { valid: false, error: 'Tidak dapat memvalidasi akun saat ini. Periksa ID atau coba lagi.' };
}

// ──── Format-based validation (strict) ────

function validateGenshin(uid: string): { valid: boolean; error?: string } {
  if (!uid) return { valid: false, error: 'UID wajib diisi' };
  uid = uid.trim();
  if (!/^\d{9,10}$/.test(uid)) return { valid: false, error: 'UID Genshin harus 9-10 digit angka' };
  const firstDigit = uid[0];
  if (!['1', '2', '5', '6', '7', '8', '9'].includes(firstDigit)) {
    return { valid: false, error: 'UID Genshin tidak valid. Server Asia diawali 8, EU: 7, America: 6' };
  }
  return { valid: true };
}

function validateHSR(uid: string): { valid: boolean; error?: string } {
  if (!uid) return { valid: false, error: 'UID wajib diisi' };
  uid = uid.trim();
  if (!/^\d{9,10}$/.test(uid)) return { valid: false, error: 'UID Honkai Star Rail harus 9-10 digit angka' };
  return { valid: true };
}

function validatePUBG(playerId: string): { valid: boolean; error?: string } {
  if (!playerId) return { valid: false, error: 'Character ID wajib diisi' };
  playerId = playerId.trim();
  if (!/^\d{8,12}$/.test(playerId)) return { valid: false, error: 'Character ID PUBG harus 8-12 digit angka' };
  return { valid: true };
}

function validateHiggs(playerId: string): { valid: boolean; error?: string } {
  if (!playerId) return { valid: false, error: 'Player ID wajib diisi' };
  playerId = playerId.trim();
  if (!/^\d{6,12}$/.test(playerId)) return { valid: false, error: 'Player ID Higgs Domino harus 6-12 digit angka' };
  return { valid: true };
}

function validateCODM(playerId: string): { valid: boolean; error?: string } {
  if (!playerId) return { valid: false, error: 'Player ID wajib diisi' };
  playerId = playerId.trim();
  if (!/^\d{8,15}$/.test(playerId)) return { valid: false, error: 'Player ID CODM harus 8-15 digit angka' };
  return { valid: true };
}

function validateValorant(riotId: string, riotTag: string): { valid: boolean; error?: string } {
  if (!riotId) return { valid: false, error: 'Riot ID wajib diisi' };
  if (!riotTag) return { valid: false, error: 'Tagline wajib diisi' };
  riotId = riotId.trim();
  riotTag = riotTag.trim();
  if (riotId.length < 3 || riotId.length > 16) return { valid: false, error: 'Riot ID harus 3-16 karakter' };
  if (riotTag.length < 3 || riotTag.length > 5) return { valid: false, error: 'Tagline harus 3-5 karakter' };
  return { valid: true };
}

function validateSteam(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: 'Email Steam wajib diisi' };
  email = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: 'Format email tidak valid' };
  return { valid: true };
}

function validateBasic(value: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length < 3) return { valid: false, error: 'ID terlalu pendek, minimal 3 karakter' };
  return { valid: true };
}
