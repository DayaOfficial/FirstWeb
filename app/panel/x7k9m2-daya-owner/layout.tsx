import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OwnerPanelShell from '@/components/layout/OwnerPanelShell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/panel/x7k9m2-daya-owner');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, username')
    .eq('id', user.id)
    .single();

  // Tolak siapa pun yang bukan owner aktif
  if (profile?.role !== 'owner' || profile?.status !== 'approved') {
    redirect('/');
  }

  return (
    <OwnerPanelShell ownerName={profile.username || 'Owner'}>
      {children}
    </OwnerPanelShell>
  );
}
