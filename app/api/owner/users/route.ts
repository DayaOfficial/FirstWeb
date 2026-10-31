import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET — ambil semua user (kecuali owner)
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
      .from('profiles')
      .select('id, username, email, status, role, created_at')
      .neq('role', 'owner')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[users] fetch error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[users] unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
