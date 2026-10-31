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

// GET — ambil semua banner (termasuk non-aktif)
export async function GET() {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const service = createServiceClient();
    const { data, error } = await service
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — tambah banner baru
export async function POST(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const file = formData.get('image') as File | null;
    const sortOrder = parseInt(formData.get('sort_order') as string || '0');
    const isActive = formData.get('is_active') === 'true';
    const link = formData.get('link') as string || null;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Judul banner wajib diisi.' }, { status: 400 });
    }

    const service = createServiceClient();
    let imageUrl = '';

    // Upload image jika ada
    if (file && file.size > 0) {
      if (file.size > 3 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran gambar maksimal 3MB.' }, { status: 400 });
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `banner_${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await service.storage
        .from('banners')
        .upload(filePath, buffer, { contentType: file.type, upsert: true });

      if (uploadError) {
        console.error('[banners] upload error:', uploadError.message);
        return NextResponse.json({ error: 'Gagal upload gambar. Pastikan bucket "banners" sudah dibuat.' }, { status: 500 });
      }

      const { data: { publicUrl } } = service.storage.from('banners').getPublicUrl(filePath);
      imageUrl = publicUrl;
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Gambar banner wajib diupload.' }, { status: 400 });
    }

    const { data, error } = await service
      .from('banners')
      .insert({ title: title.trim(), image_url: imageUrl, link, sort_order: sortOrder, is_active: isActive })
      .select()
      .single();

    if (error) {
      console.error('[banners] insert error:', error.message);
      return NextResponse.json({ error: 'Gagal menyimpan banner.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[banners] unexpected:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT — update banner
export async function PUT(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const formData = await req.formData();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const sortOrder = parseInt(formData.get('sort_order') as string || '0');
    const isActive = formData.get('is_active') === 'true';
    const link = formData.get('link') as string || null;
    const file = formData.get('image') as File | null;

    if (!id) return NextResponse.json({ error: 'ID wajib.' }, { status: 400 });

    const service = createServiceClient();
    const updateData: Record<string, unknown> = {
      title: title?.trim(), sort_order: sortOrder, is_active: isActive, link,
    };

    // Upload gambar baru jika ada
    if (file && file.size > 0) {
      if (file.size > 3 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran gambar maksimal 3MB.' }, { status: 400 });
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `banner_${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await service.storage
        .from('banners')
        .upload(filePath, buffer, { contentType: file.type, upsert: true });

      if (uploadError) {
        return NextResponse.json({ error: 'Gagal upload gambar.' }, { status: 500 });
      }

      const { data: { publicUrl } } = service.storage.from('banners').getPublicUrl(filePath);
      updateData.image_url = publicUrl;
    }

    const { data, error } = await service
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Gagal update banner.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — hapus banner
export async function DELETE(req: Request) {
  try {
    const owner = await checkOwner();
    if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID wajib.' }, { status: 400 });

    const service = createServiceClient();

    // Hapus dari database
    const { error } = await service.from('banners').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Gagal menghapus banner.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
