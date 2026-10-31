import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function checkOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role || user.user_metadata?.role;
  return role === 'owner' ? user : null;
}

// GET — ambil semua game products, grouped by game_name
export async function GET(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const gameName = searchParams.get('game_name');

    const service = createServiceClient();

    if (gameName) {
      // Get denoms for specific game
      const { data, error } = await service
        .from('products')
        .select('*')
        .eq('module', 'digiflazz')
        .eq('game_name', gameName)
        .order('price_sell', { ascending: true });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data || []);
    }

    // Get all game products grouped by game_name
    const { data, error } = await service
      .from('products')
      .select('*')
      .eq('module', 'digiflazz')
      .not('game_name', 'is', null)
      .order('game_name', { ascending: true })
      .order('price_sell', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Group by game_name
    const grouped: Record<string, {
      game_name: string;
      total_denoms: number;
      active_denoms: number;
      image_url: string | null;
      denoms: typeof data;
    }> = {};

    for (const product of (data || [])) {
      const gn = product.game_name || 'Unknown';
      if (!grouped[gn]) {
        grouped[gn] = {
          game_name: gn,
          total_denoms: 0,
          active_denoms: 0,
          image_url: product.image_url,
          denoms: [],
        };
      }
      grouped[gn].total_denoms++;
      if (product.is_active) grouped[gn].active_denoms++;
      grouped[gn].denoms.push(product);
    }

    return NextResponse.json(Object.values(grouped));
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT — update profit/harga per denom atau per game (bulk)
export async function PUT(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const service = createServiceClient();

    // Single denom update
    if (body.id) {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.price_sell !== undefined) updateData.price_sell = body.price_sell;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
      if (body.image_url !== undefined) updateData.image_url = body.image_url;

      const { data, error } = await service
        .from('products')
        .update(updateData)
        .eq('id', body.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    // Bulk update by game_name
    if (body.game_name && body.action) {
      if (body.action === 'activate_all') {
        const { error } = await service
          .from('products')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('module', 'digiflazz')
          .eq('game_name', body.game_name);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      if (body.action === 'deactivate_all') {
        const { error } = await service
          .from('products')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('module', 'digiflazz')
          .eq('game_name', body.game_name);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      if (body.action === 'set_markup' && body.markup_value !== undefined) {
        // Apply markup to all denoms in this game
        const { data: denoms } = await service
          .from('products')
          .select('id, price_modal')
          .eq('module', 'digiflazz')
          .eq('game_name', body.game_name);

        if (denoms) {
          for (const d of denoms) {
            const newPrice = body.markup_type === 'percent'
              ? Math.ceil(Number(d.price_modal) * (1 + Number(body.markup_value) / 100))
              : Math.ceil(Number(d.price_modal) + Number(body.markup_value));

            await service.from('products')
              .update({ price_sell: newPrice, markup_type: body.markup_type, markup_value: body.markup_value, updated_at: new Date().toISOString() })
              .eq('id', d.id);
          }
        }
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — upload game image
export async function POST(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const formData = await req.formData();
    const gameName = formData.get('game_name') as string;
    const file = formData.get('image') as File | null;

    if (!gameName || !file) {
      return NextResponse.json({ error: 'game_name dan image wajib.' }, { status: 400 });
    }

    const service = createServiceClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `game_${gameName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await service.storage
      .from('products')
      .upload(filePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: 'Gagal upload gambar.' }, { status: 500 });
    }

    const { data: { publicUrl } } = service.storage.from('products').getPublicUrl(filePath);

    // Update all products with this game_name
    await service.from('products')
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('module', 'digiflazz')
      .eq('game_name', gameName);

    return NextResponse.json({ success: true, image_url: publicUrl });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
