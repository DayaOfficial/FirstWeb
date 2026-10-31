import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — read all settings as key-value object
export async function GET() {
  const supabase = await createClient();

  // Verify owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'owner' && user.user_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Convert array to key-value object
  const settings: Record<string, string> = {};
  (data || []).forEach((row: { key: string; value: string | null }) => {
    settings[row.key] = row.value || '';
  });

  return NextResponse.json(settings);
}

// POST — upsert one or more settings
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Verify owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'owner' && user.user_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  // body can be { key: value, key2: value2 } or { settings: { key: value } }
  const entries = body.settings || body;

  const upserts = Object.entries(entries).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));

  if (upserts.length === 0) {
    return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
  }

  const { error } = await supabase
    .from('settings')
    .upsert(upserts, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, count: upserts.length });
}
