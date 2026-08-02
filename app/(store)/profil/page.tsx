import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfilView from './profil-view';

export const metadata = {
  title: 'Profil Saya',
};

export default async function ProfilPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/profil');
  }

  // Load profile — coba dari profiles, fallback ke auth metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url, role, status, created_at')
    .eq('id', user.id)
    .single();

  // Jika profile tidak ada di DB (belum dibuat trigger / RLS block),
  // JANGAN redirect ke login — tampilkan dari data auth
  const resolvedProfile = profile ?? {
    id: user.id,
    username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatar_url: user.user_metadata?.avatar_url || null,
    role: user.user_metadata?.role || 'user',
    status: 'active',
    created_at: user.created_at || new Date().toISOString(),
  };

  // Load orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_code, product_name, module, amount, payment_status, process_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <ProfilView
      profile={resolvedProfile}
      orders={(orders ?? []) as any}
      isOwner={resolvedProfile.role === 'owner'}
    />
  );
}
