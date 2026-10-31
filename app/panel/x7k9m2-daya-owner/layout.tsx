import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OwnerPanelShell from '@/components/layout/OwnerPanelShell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/panel/x7k9m2-daya-owner');

  // Cek dari profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, username')
    .eq('id', user.id)
    .single();

  // Cek role: profiles table ATAU auth metadata (fallback jika RLS blokir)
  const role = profile?.role || user.user_metadata?.role;
  const status = profile?.status || 'active';
  const isOwner = role === 'owner';
  const isActive = status === 'approved' || status === 'active';

  if (!isOwner || !isActive) {
    redirect('/');
  }

  const ownerName = profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Owner';

  return (
    <OwnerPanelShell ownerName={ownerName}>
      {children}
    </OwnerPanelShell>
  );
}
