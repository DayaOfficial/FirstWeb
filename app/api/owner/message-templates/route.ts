import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — read all templates
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('message_templates').select('*').order('template_key');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT — update a specific template
export async function PUT(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'owner' && user.user_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { template_key, content } = body;

  if (!template_key || !content) {
    return NextResponse.json({ error: 'template_key and content required' }, { status: 400 });
  }

  const { error } = await supabase.from('message_templates')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('template_key', template_key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST — reset template to default
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'owner' && user.user_metadata?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { template_key } = body;

  const defaults: Record<string, string> = {
    'nokos': 'Halo {nama}! 👋\n\nPesanan Nokos kamu sudah kami proses ✅\n\n📋 Detail Pesanan:\n- Order ID: {order_id}\n- Aplikasi: {aplikasi}\n- Negara: {negara}\n- Harga: {harga}\n\n📱 Nomor yang kamu terima:\n{nomor}\n\n⚠️ Segera gunakan nomor ini untuk verifikasi.\n\nTerima kasih sudah belanja di DAYA MART! 🙏',
    'robux_vilog': 'Halo {nama}! 👋\n\nPesanan Robux kamu sudah kami proses ✅\n\n📋 Detail Pesanan:\n- Order ID: {order_id}\n- Jumlah Robux: {jumlah_robux}\n- Harga: {harga}\n- Status: {status}\n\n🎮 Robux sudah masuk ke akun Roblox kamu.\nSilakan cek saldo Robux di game.\n\nTerima kasih sudah belanja di DAYA MART! 🙏',
    'app_premium': 'Halo {nama}! 👋\n\nPesanan App Premium kamu sudah kami proses ✅\n\n📋 Detail Pesanan:\n- Order ID: {order_id}\n- Aplikasi: {aplikasi}\n- Plan: {plan}\n- Harga: {harga}\n\n🔑 Detail Akun:\nEmail: {email_akun}\nPassword: {password_akun}\n\n⚠️ Jangan ubah password selama masa aktif.\n\nTerima kasih sudah belanja di DAYA MART! 🙏',
  };

  if (template_key && defaults[template_key]) {
    await supabase.from('message_templates')
      .update({ content: defaults[template_key], updated_at: new Date().toISOString() })
      .eq('template_key', template_key);
  }

  return NextResponse.json({ success: true });
}
