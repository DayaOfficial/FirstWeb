'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Save, RotateCcw, Loader2, CheckCircle2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  template_key: string;
  template_name: string;
  content: string;
  placeholders: string[];
}

const DUMMY_DATA: Record<string, Record<string, string>> = {
  nokos: { nama: 'Andi Nugroho', order_id: 'DM-20260808-001', aplikasi: 'Telegram', negara: '🇮🇩 Indonesia', harga: 'Rp 5.000', nomor: '+6281234567890' },
  robux_vilog: { nama: 'Budi Santoso', order_id: 'DM-20260808-002', jumlah_robux: '800 Robux', harga: 'Rp 120.000', status: 'Selesai' },
  app_premium: { nama: 'Siti Rahma', order_id: 'DM-20260808-003', aplikasi: 'Netflix', plan: 'Premium 1 Bulan', harga: 'Rp 65.000', email_akun: 'netflix@email.com', password_akun: 'p4ssw0rd123' },
};

const TEMPLATE_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  nokos: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  robux_vilog: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  app_premium: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
};

export default function FormatPesanPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editContents, setEditContents] = useState<Record<string, string>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/owner/message-templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
          const contents: Record<string, string> = {};
          data.forEach((t: Template) => { contents[t.template_key] = t.content; });
          setEditContents(contents);
          if (data.length > 0) setExpandedKey(data[0].template_key);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const insertPlaceholder = (templateKey: string, placeholder: string) => {
    const textarea = textareaRefs.current[templateKey];
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editContents[templateKey] || '';
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = `${before}{${placeholder}}${after}`;
    setEditContents(prev => ({ ...prev, [templateKey]: newText }));
    // Focus and move cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      const newPos = start + placeholder.length + 2;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSave = async (templateKey: string) => {
    setSaving(templateKey);
    try {
      const res = await fetch('/api/owner/message-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_key: templateKey, content: editContents[templateKey] }),
      });
      if (res.ok) {
        setSaved(templateKey);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch { /* ignore */ }
    setSaving(null);
  };

  const handleReset = async (templateKey: string) => {
    if (!confirm('Reset template ini ke default? Perubahan Anda akan hilang.')) return;
    setSaving(templateKey);
    try {
      const res = await fetch('/api/owner/message-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_key: templateKey }),
      });
      if (res.ok) {
        // Reload templates
        const reloadRes = await fetch('/api/owner/message-templates');
        if (reloadRes.ok) {
          const data = await reloadRes.json();
          setTemplates(data);
          const contents: Record<string, string> = {};
          data.forEach((t: Template) => { contents[t.template_key] = t.content; });
          setEditContents(contents);
        }
      }
    } catch { /* ignore */ }
    setSaving(null);
  };

  const getPreview = (templateKey: string) => {
    let text = editContents[templateKey] || '';
    const dummy = DUMMY_DATA[templateKey] || {};
    Object.entries(dummy).forEach(([key, value]) => {
      text = text.replaceAll(`{${key}}`, value);
    });
    return text;
  };

  const copyPreview = (templateKey: string) => {
    navigator.clipboard.writeText(getPreview(templateKey));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
          <FileText size={28} className="text-primary" /> Format Pesan
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Edit template pesan yang dikirim ke pelanggan. Gunakan placeholder untuk data dinamis.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <FileText size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
          <p className="text-sm text-on-surface-variant">Belum ada template pesan. Jalankan migrasi database terlebih dahulu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map(template => {
            const isExpanded = expandedKey === template.template_key;
            const colors = TEMPLATE_COLORS[template.template_key] || { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' };

            return (
              <div key={template.template_key} className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-soft overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedKey(isExpanded ? null : template.template_key)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-bold', colors.badge)}>{template.template_name}</span>
                    {saved === template.template_key && (
                      <span className="text-xs text-accent-green font-semibold flex items-center gap-1 animate-fade-in">
                        <CheckCircle2 size={14} /> Tersimpan!
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-on-surface-variant" /> : <ChevronDown size={18} className="text-on-surface-variant" />}
                </button>

                {/* Body */}
                {isExpanded && (
                  <div className="border-t border-outline-variant/30 p-5 space-y-5 animate-fade-in">
                    {/* Placeholder chips */}
                    <div>
                      <p className="text-xs font-semibold text-on-surface mb-2">Placeholder — klik untuk menyisipkan:</p>
                      <div className="flex flex-wrap gap-2">
                        {(template.placeholders || []).map((ph: string) => (
                          <button key={ph} onClick={() => insertPlaceholder(template.template_key, ph)}
                            className="px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors cursor-pointer">
                            {`{${ph}}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Editor + Preview side by side on desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Editor */}
                      <div>
                        <label className="block text-sm font-semibold text-on-surface mb-2">Template Pesan</label>
                        <textarea
                          ref={el => { textareaRefs.current[template.template_key] = el; }}
                          value={editContents[template.template_key] || ''}
                          onChange={e => setEditContents(prev => ({ ...prev, [template.template_key]: e.target.value }))}
                          rows={14}
                          className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                        />
                      </div>

                      {/* Preview */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-on-surface">Pratinjau</label>
                          <button onClick={() => copyPreview(template.template_key)}
                            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                            <Copy size={12} /> Salin
                          </button>
                        </div>
                        <div className={cn('rounded-xl border p-4 text-sm whitespace-pre-wrap leading-relaxed min-h-[280px]', colors.bg, colors.border)}>
                          {getPreview(template.template_key)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button onClick={() => handleSave(template.template_key)} disabled={saving === template.template_key}
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving === template.template_key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Simpan
                      </button>
                      <button onClick={() => handleReset(template.template_key)} disabled={saving === template.template_key}
                        className="px-4 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface-variant hover:text-error hover:border-error transition-colors flex items-center gap-2 disabled:opacity-50">
                        <RotateCcw size={14} /> Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
