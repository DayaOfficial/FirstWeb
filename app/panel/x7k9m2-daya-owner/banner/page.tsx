'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ImageIcon, Plus, Trash2, Eye, EyeOff, GripVertical,
  Upload, X, Edit3, Save, ArrowUp, ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerData {
  id: string;
  title: string;
  imageData: string; // base64 data URL
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function OwnerBannerPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [imageData, setImageData] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = () => {
    const stored = JSON.parse(localStorage.getItem('daya_banners') || '[]');
    setBanners(stored.sort((a: BannerData, b: BannerData) => a.sortOrder - b.sortOrder));
  };

  const saveBanners = (updated: BannerData[]) => {
    const sorted = updated.sort((a, b) => a.sortOrder - b.sortOrder);
    localStorage.setItem('daya_banners', JSON.stringify(sorted));
    setBanners(sorted);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle('');
    setImageData('');
    setSortOrder(banners.length);
    setIsActive(true);
    setEditingId(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Judul banner wajib diisi.');
      return;
    }
    if (!imageData && !editingId) {
      alert('Gambar banner wajib diupload.');
      return;
    }

    if (editingId) {
      // Update existing
      const updated = banners.map(b =>
        b.id === editingId
          ? { ...b, title: title.trim(), imageData: imageData || b.imageData, sortOrder, isActive }
          : b
      );
      saveBanners(updated);
    } else {
      // Add new
      const newBanner: BannerData = {
        id: Date.now().toString(),
        title: title.trim(),
        imageData,
        sortOrder,
        isActive,
        createdAt: new Date().toISOString(),
      };
      saveBanners([...banners, newBanner]);
    }

    resetForm();
  };

  const startEdit = (banner: BannerData) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setImageData(banner.imageData);
    setSortOrder(banner.sortOrder);
    setIsActive(banner.isActive);
    setShowForm(true);
  };

  const deleteBanner = (id: string) => {
    if (!confirm('Yakin ingin menghapus banner ini?')) return;
    saveBanners(banners.filter(b => b.id !== id));
  };

  const toggleActive = (id: string) => {
    const updated = banners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    saveBanners(updated);
  };

  const moveBanner = (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex(b => b.id === id);
    if (direction === 'up' && index > 0) {
      const updated = [...banners];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      updated.forEach((b, i) => b.sortOrder = i);
      saveBanners(updated);
    } else if (direction === 'down' && index < banners.length - 1) {
      const updated = [...banners];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      updated.forEach((b, i) => b.sortOrder = i);
      saveBanners(updated);
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
        <button
          onClick={() => { resetForm(); setSortOrder(banners.length); setShowForm(true); }}
          className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2"
        >
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
            <button onClick={resetForm} className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Judul Banner</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Contoh: Promo Top Up Game"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Upload Gambar</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/[0.02] transition-all"
                  >
                    <Upload size={32} className="mx-auto text-on-surface-variant mb-2" />
                    <p className="text-sm text-on-surface-variant">Klik untuk upload gambar</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">JPG, PNG, WebP • Maks 3MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Urutan</label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={e => setSortOrder(Number(e.target.value))}
                      min={0}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Status</label>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={cn(
                        'w-full py-3 px-4 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2',
                        isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
                      )}
                    >
                      {isActive ? <><Eye size={16} /> Aktif</> : <><EyeOff size={16} /> Nonaktif</>}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editingId ? 'Simpan Perubahan' : 'Tambah Banner'}
                </button>
              </div>

              {/* Right: Preview */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Preview</label>
                <div className="bg-surface-container-high rounded-xl overflow-hidden aspect-[21/9] flex items-center justify-center border border-outline-variant/30">
                  {imageData ? (
                    <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
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
        {banners.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-12 text-center shadow-soft">
            <ImageIcon size={48} className="mx-auto text-outline-variant mb-4" />
            <p className="text-on-surface-variant font-medium">Belum ada banner</p>
            <p className="text-xs text-on-surface-variant mt-1">Klik &quot;Tambah Banner&quot; untuk menambahkan banner baru ke carousel homepage.</p>
          </div>
        ) : (
          banners.map((banner, index) => (
            <div
              key={banner.id}
              className={cn(
                'bg-surface-container-lowest rounded-xl border p-4 shadow-soft transition-all hover:shadow-[0px_8px_30px_rgba(192,0,58,0.08)] flex items-center gap-4',
                banner.isActive ? 'border-outline-variant/20' : 'border-outline-variant/10 opacity-60'
              )}
            >
              {/* Drag Handle & Order */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => moveBanner(banner.id, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-colors"
                >
                  <ArrowUp size={14} />
                </button>
                <GripVertical size={16} className="text-outline-variant" />
                <button
                  onClick={() => moveBanner(banner.id, 'down')}
                  disabled={index === banners.length - 1}
                  className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-colors"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              {/* Thumbnail */}
              <div className="w-40 h-20 rounded-lg overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/20">
                <img src={banner.imageData} alt={banner.title} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-on-surface truncate">{banner.title}</h4>
                <p className="text-xs text-on-surface-variant mt-1">Urutan: {banner.sortOrder}</p>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1.5 border',
                  banner.isActive
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                )}>
                  {banner.isActive ? <><Eye size={10} /> Aktif</> : <><EyeOff size={10} /> Nonaktif</>}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(banner.id)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    banner.isActive
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}
                  title={banner.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => startEdit(banner)}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => deleteBanner(banner.id)}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
