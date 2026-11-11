// Pakasir sudah diganti NPay. Redirect ke /api/debug/npay.
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ error: 'Pakasir sudah dihapus. Gunakan /api/debug/npay' }, { status: 410 });
}
