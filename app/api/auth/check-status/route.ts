import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
    }

    // Pakai service client untuk bypass RLS
    const service = createServiceClient();
    const { data: profile } = await service
      .from('profiles')
      .select('status, role')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      status: profile?.status || 'pending',
      role: profile?.role || 'user',
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
