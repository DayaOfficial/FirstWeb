import { NextResponse } from 'next/server';

/**
 * POST /api/validate-game-id
 * 
 * Validasi ID game dan return username jika ditemukan.
 * Menggunakan API gratis untuk cek username game.
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
        result = await validateGeneric(fields.uid, 'Genshin Impact');
        break;
      case 'honkai_star_rail':
        result = await validateGeneric(fields.uid, 'Honkai Star Rail');
        break;
      case 'pubg_mobile':
        result = await validateGeneric(fields.player_id, 'PUBG Mobile');
        break;
      case 'higgs_domino':
        result = await validateGeneric(fields.player_id, 'Higgs Domino');
        break;
      case 'codm':
        result = await validateGeneric(fields.player_id, 'Call of Duty Mobile');
        break;
      default:
        // Game yang tidak punya validasi → langsung pass
        result = { valid: true };
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[validate-game-id] Error:', err);
    // Jika validasi gagal (API down dll), tetap izinkan lanjut
    return NextResponse.json({ valid: true, username: undefined, warning: 'Validasi tidak tersedia, pastikan ID benar' });
  }
}

// ──── Mobile Legends ────
async function validateMobileLegends(userId: string, zoneId: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  if (!userId || !zoneId) return { valid: false, error: 'User ID dan Zone ID wajib diisi' };
  if (!/^\d+$/.test(userId)) return { valid: false, error: 'User ID harus berupa angka' };
  if (!/^\d+$/.test(zoneId)) return { valid: false, error: 'Zone ID harus berupa angka' };

  // Coba beberapa endpoint validasi
  const endpoints = [
    `https://api.isan.eu.org/nickname/ml?id=${userId}&zone=${zoneId}`,
    `https://api.cek.my.id/ml?id=${userId}&zone=${zoneId}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      
      // Handle various response formats
      const username = data?.username || data?.name || data?.data?.username || data?.data?.name || data?.result?.username;
      if (username && username !== '' && username !== 'null') {
        return { valid: true, username };
      }
      
      // API returned but no username found → ID invalid
      if (data?.status === false || data?.error || data?.success === false) {
        return { valid: false, error: 'Akun tidak ditemukan. Periksa kembali User ID dan Zone ID.' };
      }
    } catch {
      continue; // Try next endpoint
    }
  }

  // Semua endpoint gagal → fallback, izinkan dengan warning
  return { valid: true, warning: 'Validasi tidak tersedia saat ini' } as any;
}

// ──── Free Fire ────
async function validateFreeFire(playerId: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  if (!playerId) return { valid: false, error: 'Player ID wajib diisi' };
  if (!/^\d+$/.test(playerId)) return { valid: false, error: 'Player ID harus berupa angka' };

  const endpoints = [
    `https://api.isan.eu.org/nickname/ff?id=${playerId}`,
    `https://api.cek.my.id/ff?id=${playerId}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();

      const username = data?.username || data?.name || data?.data?.username || data?.data?.name || data?.result?.username;
      if (username && username !== '' && username !== 'null') {
        return { valid: true, username };
      }

      if (data?.status === false || data?.error || data?.success === false) {
        return { valid: false, error: 'Akun tidak ditemukan. Periksa kembali Player ID.' };
      }
    } catch {
      continue;
    }
  }

  return { valid: true, warning: 'Validasi tidak tersedia saat ini' } as any;
}

// ──── Generic (format/length validation only) ────
async function validateGeneric(id: string, gameName: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  if (!id || !id.trim()) return { valid: false, error: `ID ${gameName} wajib diisi` };
  // Basic format validation
  if (id.trim().length < 3) return { valid: false, error: `ID ${gameName} terlalu pendek` };
  return { valid: true };
}
