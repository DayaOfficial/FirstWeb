import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfilView from './profil-view';

export const metadata = {
  title: 'Profil Saya',
};

export default async function ProfilPage() {
  const supabase = await createClient();

  // Baca session di SERVER — bukan di client useEffect
  const { data: { user } } = await supabase.auth.getUser();

  // Safety net (seharusnya middleware sudah handle, ini lapis kedua)
  if (!user) {
    redirect('/login?redirect=/profil');
  }

  // Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url, role, status, created_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login?redirect=/profil');
  }

  // Load orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_code, product_name, module, amount, payment_status, process_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // TIDAK ADA lagi teks "belum login" — kalau sampai sini, user PASTI login
  return (
    <ProfilView
      profile={profile}
      orders={(orders ?? []) as any}
      isOwner={profile.role === 'owner'}
    />
  );
}
