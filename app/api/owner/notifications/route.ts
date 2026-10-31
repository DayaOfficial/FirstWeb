import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET — ambil semua notifikasi
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    // Cek owner
    const role = user.user_metadata?.role;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (role !== 'owner' && profile?.role !== 'owner') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Pakai service client untuk bypass RLS
    const service = createServiceClient();
    const { data, error } = await service
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — mark as read
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id, markAll } = await req.json();
    const service = createServiceClient();

    if (markAll) {
      await service.from('notifications').update({ is_read: true }).eq('is_read', false);
    } else if (id) {
      await service.from('notifications').update({ is_read: true }).eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — hapus notifikasi
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await req.json();
    const service = createServiceClient();
    await service.from('notifications').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
