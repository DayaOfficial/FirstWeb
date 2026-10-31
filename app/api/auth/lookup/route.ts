import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.trim())
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ email: profile.email });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
