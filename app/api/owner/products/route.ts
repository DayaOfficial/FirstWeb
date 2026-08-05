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

// GET — ambil semua produk
export async function GET() {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const service = createServiceClient();
    const { data, error } = await service
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — tambah produk manual
export async function POST(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const category = formData.get('category') as string || null;
    const brand = formData.get('brand') as string || null;
    const module_ = formData.get('module') as string || 'manual_app';
    const priceSell = parseFloat(formData.get('price_sell') as string || '0');
    const stock = parseInt(formData.get('stock') as string || '-1');
    const description = formData.get('description') as string || null;
    const isActive = formData.get('is_active') !== 'false';
    const gameName = formData.get('game_name') as string || null;
    const currencyLabel = formData.get('currency_label') as string || null;
    const file = formData.get('image') as File | null;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama produk wajib diisi.' }, { status: 400 });
    }
    if (priceSell <= 0) {
      return NextResponse.json({ error: 'Harga jual harus lebih dari 0.' }, { status: 400 });
    }

    const service = createServiceClient();
    let imageUrl: string | null = null;

    // Upload image jika ada
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran gambar maksimal 2MB.' }, { status: 400 });
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `product_${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await service.storage
        .from('products')
        .upload(filePath, buffer, { contentType: file.type, upsert: true });

      if (uploadError) {
        console.error('[products] upload error:', uploadError.message);
        // Non-fatal: lanjut tanpa gambar
      } else {
        const { data: { publicUrl } } = service.storage.from('products').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }
    }

    const { data, error } = await service
      .from('products')
      .insert({
        name: name.trim(),
        category,
        brand,
        module: module_,
        price_sell: priceSell,
        stock,
        description,
        is_active: isActive,
        game_name: gameName,
        currency_label: currencyLabel,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('[products] insert error:', error.message);
      return NextResponse.json({ error: `Gagal menyimpan produk: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[products] unexpected:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT — update produk
export async function PUT(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const formData = await req.formData();
    const id = formData.get('id') as string;
    if (!id) return NextResponse.json({ error: 'ID wajib.' }, { status: 400 });

    const name = formData.get('name') as string;
    const priceSell = parseFloat(formData.get('price_sell') as string || '0');
    const file = formData.get('image') as File | null;

    const service = createServiceClient();
    const updateData: Record<string, unknown> = {
      name: name?.trim(),
      category: formData.get('category') as string || null,
      brand: formData.get('brand') as string || null,
      price_sell: priceSell,
      stock: parseInt(formData.get('stock') as string || '-1'),
      description: formData.get('description') as string || null,
      is_active: formData.get('is_active') !== 'false',
      game_name: formData.get('game_name') as string || null,
      currency_label: formData.get('currency_label') as string || null,
      updated_at: new Date().toISOString(),
    };

    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran gambar maksimal 2MB.' }, { status: 400 });
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `product_${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await service.storage
        .from('products')
        .upload(filePath, buffer, { contentType: file.type, upsert: true });
      if (!uploadError) {
        const { data: { publicUrl } } = service.storage.from('products').getPublicUrl(filePath);
        updateData.image_url = publicUrl;
      }
    }

    const { data, error } = await service
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Gagal update produk: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — hapus produk
export async function DELETE(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID wajib.' }, { status: 400 });

    const service = createServiceClient();
    const { error } = await service.from('products').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Gagal menghapus produk.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
