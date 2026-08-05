'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ImageIcon, Plus, Trash2, Eye, EyeOff, GripVertical,
  Upload, X, Edit3, Save, ArrowUp, ArrowDown, Loader2, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerData {
  id: string;
  title: string;
  image_url: string;
  link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function OwnerBannerPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error('[banners] load error:', err);
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Hanya file gambar yang diperbolehkan.'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('Ukuran file maksimal 3MB.'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle(''); setLink(''); setImageFile(null); setImagePreview('');
    setSortOrder(banners.length); setIsActive(true); setEditingId(null);
    setShowForm(false); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Judul banner wajib diisi.'); return; }
    if (!imageFile && !editingId) { setError('Gambar banner wajib diupload.'); return; }

    setSaving(true); setError('');
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('sort_order', sortOrder.toString());
      formData.append('is_active', isActive.toString());
      if (link) formData.append('link', link);
      if (imageFile) formData.append('image', imageFile);

      if (editingId) {
        formData.append('id', editingId);
        const res = await fetch('/api/owner/banners', { method: 'PUT', body: formData });
        if (res.ok) {
          const updated = await res.json();
          setBanners(prev => prev.map(b => b.id === editingId ? updated : b).sort((a, b) => a.sort_order - b.sort_order));
          resetForm();
        } else {
          const data = await res.json();
          setError(data.error || 'Gagal update banner.');
        }
      } else {
        const res = await fetch('/api/owner/banners', { method: 'POST', body: formData });
        if (res.ok) {
          const newBanner = await res.json();
          setBanners(prev => [...prev, newBanner].sort((a, b) => a.sort_order - b.sort_order));
          resetForm();
        } else {
          const data = await res.json();
          setError(data.error || 'Gagal menambah banner.');
        }
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    }
    setSaving(false);
  };

  const startEdit = (banner: BannerData) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setLink(banner.link || '');
    setImagePreview(banner.image_url);
    setImageFile(null);
    setSortOrder(banner.sort_order);
    setIsActive(banner.is_active);
    setShowForm(true);
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Yakin ingin menghapus banner ini?')) return;
    try {
      const res = await fetch('/api/owner/banners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setBanners(prev => prev.filter(b => b.id !== id));
      else alert('Gagal menghapus banner.');
    } catch { alert('Terjadi kesalahan jaringan.'); }
  };

  const toggleActive = async (banner: BannerData) => {
    const formData = new FormData();
    formData.append('id', banner.id);
    formData.append('title', banner.title);
    formData.append('sort_order', banner.sort_order.toString());
    formData.append('is_active', (!banner.is_active).toString());
    if (banner.link) formData.append('link', banner.link);

    try {
      const res = await fetch('/api/owner/banners', { method: 'PUT', body: formData });
      if (res.ok) {
        const updated = await res.json();
        setBanners(prev => prev.map(b => b.id === banner.id ? updated : b));
      }
    } catch { /* ignore */ }
  };

  const moveBanner = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex(b => b.id === id);
    if (direction === 'up' && index > 0) {
      const updated = [...banners];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      updated.forEach((b, i) => b.sort_order = i);
      setBanners(updated);
      // Update both in DB
      for (const b of updated) {
        const fd = new FormData();
        fd.append('id', b.id); fd.append('title', b.title);
        fd.append('sort_order', b.sort_order.toString());
        fd.append('is_active', b.is_active.toString());
        if (b.link) fd.append('link', b.link);
        await fetch('/api/owner/banners', { method: 'PUT', body: fd });
      }
    } else if (direction === 'down' && index < banners.length - 1) {
      const updated = [...banners];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      updated.forEach((b, i) => b.sort_order = i);
      setBanners(updated);
      for (const b of updated) {
        const fd = new FormData();
        fd.append('id', b.id); fd.append('title', b.title);
        fd.append('sort_order', b.sort_order.toString());
        fd.append('is_active', b.is_active.toString());
        if (b.link) fd.append('link', b.link);
        await fetch('/api/owner/banners', { method: 'PUT', body: fd });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <ImageIcon size={28} className="text-primary" />
            Manajemen Banner
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Kelola banner yang tampil di halaman utama (carousel).</p>
        </div>
        <button onClick={() => { resetForm(); setSortOrder(banners.length); setShowForm(true); }}
          className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2">
          <Plus size={16} /> Tambah Banner
        </button>
      </div>

      {/* Add/Edit Banner Form */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-2xl border border-primary/15 p-6 shadow-soft animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">
              {editingId ? 'Edit Banner' : 'Tambah Banner Baru'}
            </h3>
            <button onClick={resetForm} className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant"><X size={18} /></button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/30 rounded-xl mb-4 animate-fade-in">
              <AlertCircle size={16} className="text-error shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Judul Banner <span className="text-error">*</span></label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Promo Top Up Game"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Link (opsional)</label>
                  <input type="text" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..."
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Upload Gambar {!editingId && <span className="text-error">*</span>}</label>
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/[0.02] transition-all">
                    <Upload size={32} className="mx-auto text-on-surface-variant mb-2" />
                    <p className="text-sm text-on-surface-variant">Klik untuk upload gambar</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">JPG, PNG, WebP • Maks 3MB</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Urutan</label>
                    <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} min={0}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Status</label>
                    <button type="button" onClick={() => setIsActive(!isActive)}
                      className={cn('w-full py-3 px-4 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2',
                        isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-surface-container-low text-on-surface-variant border-outline-variant')}>
                      {isActive ? <><Eye size={16} /> Aktif</> : <><EyeOff size={16} /> Nonaktif</>}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={saving}
                  className="w-full py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Banner'}
                </button>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Preview</label>
                <div className="bg-surface-container-high rounded-xl overflow-hidden aspect-[21/9] flex items-center justify-center border border-outline-variant/30">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={48} className="mx-auto text-outline-variant mb-2" />
                      <p className="text-sm text-on-surface-variant">Belum ada gambar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Banner List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : banners.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-12 text-center shadow-soft">
            <ImageIcon size={48} className="mx-auto text-outline-variant mb-4" />
            <p className="text-on-surface-variant font-medium">Belum ada banner</p>
            <p className="text-xs text-on-surface-variant mt-1">Klik &quot;Tambah Banner&quot; untuk menambahkan banner baru ke carousel homepage.</p>
          </div>
        ) : (
          banners.map((banner, index) => (
            <div key={banner.id}
              className={cn('bg-surface-container-lowest rounded-xl border p-4 shadow-soft transition-all hover:shadow-[0px_8px_30px_rgba(192,0,58,0.08)] flex items-center gap-4',
                banner.is_active ? 'border-outline-variant/20' : 'border-outline-variant/10 opacity-60')}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button onClick={() => moveBanner(banner.id, 'up')} disabled={index === 0}
                  className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-colors"><ArrowUp size={14} /></button>
                <GripVertical size={16} className="text-outline-variant" />
                <button onClick={() => moveBanner(banner.id, 'down')} disabled={index === banners.length - 1}
                  className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-colors"><ArrowDown size={14} /></button>
              </div>
              <div className="w-40 h-20 rounded-lg overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/20">
                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-on-surface truncate">{banner.title}</h4>
                <p className="text-xs text-on-surface-variant mt-1">Urutan: {banner.sort_order}</p>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1.5 border',
                  banner.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                  {banner.is_active ? <><Eye size={10} /> Aktif</> : <><EyeOff size={10} /> Nonaktif</>}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(banner)}
                  className={cn('p-2 rounded-lg transition-colors', banner.is_active ? 'text-green-600 hover:bg-green-50' : 'text-on-surface-variant hover:bg-surface-container-high')}
                  title={banner.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                  {banner.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => startEdit(banner)} className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors" title="Edit"><Edit3 size={16} /></button>
                <button onClick={() => deleteBanner(banner.id)} className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors" title="Hapus"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
