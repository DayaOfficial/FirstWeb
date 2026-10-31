import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Cek env vars
  results.hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  results.hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  results.serviceKeyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...'
    : 'NOT SET';

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ...results, error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 });
  }

  try {
    const supabase = createServiceClient();

    // 2. Cek koneksi — list tables
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, role, status')
      .limit(5);

    results.profiles = { data: profilesData, error: profilesError?.message };

    // 3. Cek notifications table columns
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);

    results.notifications = { data: notifData, error: notifError?.message };

    // 4. Coba insert test notification
    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert({
        type: 'test',
        title: 'Test Notifikasi',
        message: 'Ini adalah test dari diagnostik API.',
        is_read: false,
      })
      .select();

    results.testInsert = { data: insertData, error: insertError?.message };

    // 5. Jika insert berhasil, hapus test notification
    if (insertData && insertData[0]) {
      await supabase.from('notifications').delete().eq('id', insertData[0].id);
      results.testCleanup = 'deleted';
    }

    return NextResponse.json(results);
  } catch (err) {
    results.unexpectedError = String(err);
    return NextResponse.json(results, { status: 500 });
  }
}
