'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Stethoscope, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface DiagRow {
  name: string;
  ok: boolean;
  message: string;
}

export default function DiagnosaPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<DiagRow[]>([]);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setRows([]);
    const out: DiagRow[] = [];

    // 1. Check owner role from profiles
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        out.push({ name: 'Autentikasi', ok: false, message: 'Tidak login. Login dulu sebagai owner.' });
        setRows(out);
        setRunning(false);
        return;
      }

      const { data: prof, error: e1 } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      out.push({
        name: 'Role owner terbaca dari profiles',
        ok: prof?.role === 'owner',
        message: e1?.message || `role=${prof?.role || 'null'}, status=${prof?.status || 'null'}`,
      });
    } catch (err: any) {
      out.push({ name: 'Role owner terbaca', ok: false, message: err?.message || 'Error tidak diketahui' });
    }

    // 2. Write test to settings
    try {
      const { error: e2 } = await supabase
        .from('settings')
        .upsert({ key: '_diag_test', value: 'ok', updated_at: new Date().toISOString() }, { onConflict: 'key' });
      out.push({
        name: 'Tulis ke tabel settings (RLS owner)',
        ok: !e2,
        message: e2?.message || 'Berhasil upsert + baca kembali',
      });
      // Cleanup
      if (!e2) {
        await supabase.from('settings').delete().eq('key', '_diag_test');
      }
    } catch (err: any) {
      out.push({ name: 'Tulis ke tabel settings', ok: false, message: err?.message || 'Error' });
    }

    // 3. Write test to products
    try {
      const { data: ins, error: e3 } = await supabase
        .from('products')
        .insert({ module: '_diag', name: 'Diagnosa Test', is_active: false })
        .select()
        .single();
      out.push({
        name: 'Tulis ke tabel products (RLS owner)',
        ok: !e3,
        message: e3?.message || `id=${ins?.id || '?'} — berhasil insert + hapus`,
      });
      // Cleanup
      if (ins?.id) {
        await supabase.from('products').delete().eq('id', ins.id);
      }
    } catch (err: any) {
      out.push({ name: 'Tulis ke tabel products', ok: false, message: err?.message || 'Error' });
    }

    // 4. Check storage bucket
    try {
      const { error: e4 } = await supabase.storage
        .from('brand-logos')
        .list('', { limit: 1 });
      out.push({
        name: 'Storage bucket brand-logos',
        ok: !e4,
        message: e4?.message || 'Bucket siap digunakan',
      });
    } catch (err: any) {
      out.push({ name: 'Storage bucket brand-logos', ok: false, message: err?.message || 'Error' });
    }

    // 5. Check storage bucket products
    try {
      const { error: e5 } = await supabase.storage
        .from('products')
        .list('', { limit: 1 });
      out.push({
        name: 'Storage bucket products',
        ok: !e5,
        message: e5?.message || 'Bucket siap digunakan',
      });
    } catch (err: any) {
      out.push({ name: 'Storage bucket products', ok: false, message: err?.message || 'Error' });
    }

    setRows(out);
    setRunning(false);
  }

  const allPass = rows.length > 0 && rows.every(r => r.ok);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <Stethoscope size={28} className="text-primary" />
          Diagnosa Sistem
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Periksa apakah database, RLS, dan storage berfungsi dengan benar. Jalankan setelah menerapkan skrip SQL.
        </p>
      </div>

      {/* Run button */}
      <button
        onClick={run}
        disabled={running}
        className="px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {running ? (
          <><Loader2 size={16} className="animate-spin" /> Memeriksa...</>
        ) : (
          <><RefreshCw size={16} /> Jalankan Pemeriksaan</>
        )}
      </button>

      {/* Results */}
      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.name}
              className={`rounded-xl px-5 py-4 text-sm border transition-all ${
                r.ok
                  ? 'bg-green-500/5 border-green-500/20 text-green-700'
                  : 'bg-red-500/5 border-red-500/20 text-red-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {r.ok ? (
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className={`text-xs mt-0.5 ${r.ok ? 'text-green-600/80' : 'text-red-600/80'}`}>
                    {r.message}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          {allPass && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm font-semibold text-center">
              ✅ Semua pemeriksaan berhasil! Database, RLS, dan storage siap.
            </div>
          )}
          {rows.length > 0 && !allPass && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm text-center">
              ⚠️ Ada pemeriksaan yang gagal. Pastikan skrip SQL <code className="font-mono bg-amber-100 px-1 rounded">step-10b-schema-rls.sql</code> sudah dijalankan di Supabase SQL Editor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
