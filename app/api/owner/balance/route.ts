import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getDigiflazzBalance, getJokerPanelBalance } from '@/lib/providers/balance';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const provider = new URL(req.url).searchParams.get('provider');
  const results = [];

  // Service client untuk insert (bypass RLS)
  const serviceSupabase = createServiceClient();

  if (!provider || provider === 'digiflazz') {
    const d = await getDigiflazzBalance();
    results.push(d);
    // Simpan ke riwayat
    await serviceSupabase.from('provider_balances').insert({
      provider: d.provider,
      balance: d.balance,
      currency: d.currency,
      raw_response: 'raw' in d ? d.raw : null,
      error: 'error' in d ? d.error : null,
    });
  }

  if (!provider || provider === 'jokerpanel') {
    const j = await getJokerPanelBalance();
    results.push(j);
    // Simpan ke riwayat
    await serviceSupabase.from('provider_balances').insert({
      provider: j.provider,
      balance: j.balance,
      currency: j.currency,
      raw_response: 'raw' in j ? j.raw : null,
      error: 'error' in j ? j.error : null,
    });
  }

  return NextResponse.json({ balances: results });
}
