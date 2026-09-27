import { NextResponse } from 'next/server';
import { getSprint, getSettings } from '@/lib/server-config';
import { sprintServices } from '@/lib/sprintpedia';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // We handle caching in-memory

/**
 * Platform detection — mirrors the Telegram bot's PLATFORM_GROUPS / categorizePlatform.
 */
const PLATFORM_KEYWORDS = [
  'instagram', 'tiktok', 'youtube', 'facebook', 'twitter',
  'telegram', 'spotify', 'threads', 'shopee', 'snackvideo',
  'linkedin', 'twitch', 'discord', 'pinterest', 'google',
  'whatsapp', 'website', 'roblox', 'soundcloud', 'twitterx',
  'snapchat', 'reddit', 'quora', 'wechat', 'line',
  'tumblr', 'vimeo', 'dailymotion', 'likee', 'kwai',
  'clubhouse', 'reverbnation', 'mixcloud', 'audiomack',
  'deezer', 'apple music', 'shazam', 'napster',
  'tokopedia', 'lazada', 'bukalapak', 'gmail',
];

function platformOf(name: string, category: string): string {
  const lower = `${name} ${category}`.toLowerCase();
  const found = PLATFORM_KEYWORDS.find(k => lower.includes(k));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : 'Lainnya';
}

// In-memory cache (like bot's globalSprint)
let cachedServices: any[] = [];
let lastFetch = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes, same as bot

/**
 * GET /api/store/smm-live
 * 
 * Live-fetches ALL services from SprintPedia API (like the bot does),
 * applies markup from database, and merges platform icon URLs from database.
 * 
 * Falls back to cached data if API is down.
 * This ensures the store always has the full service list.
 */
export async function GET() {
  try {
    const cfg = await getSprint();
    if (!cfg.apiKey || !cfg.secretKey) {
      return NextResponse.json(
        { services: [], error: 'SprintPedia API belum dikonfigurasi.' },
        { status: 200 }
      );
    }

    const now = Date.now();

    // Use cache if still fresh
    if (cachedServices.length > 0 && (now - lastFetch) < CACHE_TTL) {
      return NextResponse.json({ services: cachedServices, fromCache: true });
    }

    // Live fetch from SprintPedia (like bot's fetchSprintServices)
    let rawServices: any[] = [];
    try {
      const json = await sprintServices(cfg);
      // API v2 bisa return array langsung ATAU {data: [...]} — handle keduanya (sama seperti bot)
      rawServices = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
    } catch (fetchErr) {
      console.error('[smm-live] SprintPedia fetch error:', fetchErr);
      // If we have cached data, return it
      if (cachedServices.length > 0) {
        return NextResponse.json({ services: cachedServices, fromCache: true, stale: true });
      }
      return NextResponse.json({ services: [], error: 'SprintPedia sedang maintenance.' });
    }

    if (rawServices.length === 0 && cachedServices.length > 0) {
      return NextResponse.json({ services: cachedServices, fromCache: true });
    }

    // Get markup settings from database
    const settings = await getSettings(['sprint_markup_percent', 'sprint_markup_flat']);
    const markupPercent = Number(settings.sprint_markup_percent) || 30; // default 30%
    const markupFlat = Number(settings.sprint_markup_flat) || 0;

    // Get platform icon URLs from database (products table)
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: iconData } = await sb
      .from('products')
      .select('brand, platform_icon_url')
      .eq('module', 'sprintpedia')
      .not('platform_icon_url', 'is', null);

    const iconMap: Record<string, string> = {};
    if (iconData) {
      for (const row of iconData) {
        if (row.platform_icon_url && !iconMap[row.brand]) {
          iconMap[row.brand] = row.platform_icon_url;
        }
      }
    }

    // Transform services — apply global markup to all services
    const services = rawServices.map((s: any) => {
      const serviceId = String(s.service || s.id);
      const platform = platformOf(s.name ?? '', s.category ?? '');
      const basePrice = Number(s.rate || s.price);

      // Global markup — same for all services
      const sellPrice = Math.round(basePrice * (1 + markupPercent / 100)) + markupFlat;

      return {
        id: serviceId,
        provider_code: serviceId,
        name: s.name,
        brand: platform,
        smm_category: s.category || null,
        service_type: s.type || null,
        description: s.description || null,
        min_qty: Number(s.min) || 10,
        max_qty: Number(s.max) || 100000,
        price_sell: sellPrice,
        price_modal: basePrice,
        is_refillable: !!s.refill,
        refill_days: Number(s.refill_days || 0),
        is_cancelable: !!s.cancel,
        avg_time: s.avg_time || null,
        platform_icon_url: iconMap[platform] || null,
        is_active: true,
      };
    });

    // Filter only active services
    const activeServices = services.filter((s: any) => s.is_active !== false);

    // Update cache
    cachedServices = activeServices;
    lastFetch = now;

    return NextResponse.json({
      services: activeServices,
      total: rawServices.length,
      active: activeServices.length,
      fromCache: false,
    });
  } catch (err: any) {
    console.error('[smm-live] unexpected error:', err);
    // Return cached data if available
    if (cachedServices.length > 0) {
      return NextResponse.json({ services: cachedServices, fromCache: true, stale: true });
    }
    return NextResponse.json({ services: [], error: err.message }, { status: 500 });
  }
}
