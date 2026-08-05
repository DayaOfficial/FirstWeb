'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package, Search, Plus, Edit3, Trash2, Eye, EyeOff,
  Loader2, X, Save, Upload, AlertCircle, ImageIcon
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';

interface ProductData {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  module: string;
  price_sell: number;
  price_modal: number;
  stock: number;
  image_url: string | null;
  description: string | null;
  game_name: string | null;
  currency_label: string | null;
  is_active: boolean;
  created_at: string;
}

const MODULE_OPTIONS = [
  { value: 'manual_app', label: 'App Premium' },
  { value: 'manual_robux', label: 'Robux Vilog' },
  { value: 'manual_nokos', label: 'Nokos' },
  { value: 'digiflazz', label: 'Digiflazz (Otomatis)' },
  { value: 'jokerpanel', label: 'JokerPanel (Otomatis)' },
];

export default function OwnerProdukPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModule, setFormModule] = useState('manual_app');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('-1');
  const [formDescription, setFormDescription] = useState('');
  const [formGameName, setFormGameName] = useState('');
  const [formCurrency, setFormCurrency] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/products');
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error('[products] load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const resetForm = () => {
    setFormName(''); setFormCategory(''); setFormBrand('');
    setFormModule('manual_app'); setFormPrice(''); setFormStock('-1');
    setFormDescription(''); setFormGameName(''); setFormCurrency('');
    setFormIsActive(true); setFormImageFile(null); setFormImagePreview('');
    setEditingId(null); setShowForm(false); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (p: ProductData) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormCategory(p.category || '');
    setFormBrand(p.brand || '');
    setFormModule(p.module);
    setFormPrice(p.price_sell.toString());
    setFormStock(p.stock.toString());
    setFormDescription(p.description || '');
    setFormGameName(p.game_name || '');
    setFormCurrency(p.currency_label || '');
    setFormIsActive(p.is_active);
    setFormImagePreview(p.image_url || '');
    setFormImageFile(null);
    setShowForm(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Maks 2MB'); return; }
    setFormImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFormImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { setError('Nama produk wajib diisi.'); return; }
    if (!formPrice || parseFloat(formPrice) <= 0) { setError('Harga jual harus lebih dari 0.'); return; }

    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', formName.trim());
      fd.append('category', formCategory);
      fd.append('brand', formBrand);
      fd.append('module', formModule);
      fd.append('price_sell', formPrice);
      fd.append('stock', formStock);
      fd.append('description', formDescription);
      fd.append('game_name', formGameName);
      fd.append('currency_label', formCurrency);
      fd.append('is_active', formIsActive.toString());
      if (formImageFile) fd.append('image', formImageFile);

      if (editingId) {
        fd.append('id', editingId);
        const res = await fetch('/api/owner/products', { method: 'PUT', body: fd });
        if (res.ok) {
          const updated = await res.json();
          setProducts(prev => prev.map(p => p.id === editingId ? updated : p));
          resetForm();
        } else {
          const data = await res.json();
          setError(data.error || 'Gagal update produk.');
        }
      } else {
        const res = await fetch('/api/owner/products', { method: 'POST', body: fd });
        if (res.ok) {
          const newProduct = await res.json();
          setProducts(prev => [newProduct, ...prev]);
          resetForm();
        } else {
          const data = await res.json();
          setError(data.error || 'Gagal menambah produk.');
        }
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    }
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      const res = await fetch('/api/owner/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setProducts(prev => prev.filter(p => p.id !== id));
      else alert('Gagal menghapus produk.');
    } catch { alert('Terjadi kesalahan jaringan.'); }
  };

  const toggleActive = async (p: ProductData) => {
    const fd = new FormData();
    fd.append('id', p.id);
    fd.append('name', p.name);
    fd.append('price_sell', p.price_sell.toString());
    fd.append('stock', p.stock.toString());
    fd.append('is_active', (!p.is_active).toString());
    fd.append('module', p.module);
    if (p.category) fd.append('category', p.category);
    if (p.brand) fd.append('brand', p.brand);
    try {
      const res = await fetch('/api/owner/products', { method: 'PUT', body: fd });
      if (res.ok) {
        const updated = await res.json();
        setProducts(prev => prev.map(item => item.id === p.id ? updated : item));
      }
    } catch { /* ignore */ }
  };

  const categories = ['all', ...new Set(products.map(p => p.category || 'Lainnya').filter(Boolean))];
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (p.category || 'Lainnya') === filter;
    return matchSearch && matchFilter;
  });

  const moduleLabel = (m: string) => MODULE_OPTIONS.find(o => o.value === m)?.label || m;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-[family-name:var(--font-heading)] flex items-center gap-3">
            <Package size={28} className="text-primary" /> Produk
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Kelola produk dan layanan yang dijual. Total: {products.length} produk</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-2xl border border-primary/15 p-6 shadow-soft animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">
              {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Col 1: Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Nama Produk <span className="text-error">*</span></label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Netflix Premium 1 Bulan"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Modul</label>
                  <select value={formModule} onChange={e => setFormModule(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer">
                    {MODULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Kategori</label>
                    <input type="text" value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="App Premium"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Brand</label>
                    <input type="text" value={formBrand} onChange={e => setFormBrand(e.target.value)} placeholder="Netflix"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                </div>
              </div>

              {/* Col 2: Pricing & Stock */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Harga Jual (Rp) <span className="text-error">*</span></label>
                  <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="45000" min={0}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Stok <span className="text-xs text-on-surface-variant">(-1 = unlimited)</span></label>
                  <input type="number" value={formStock} onChange={e => setFormStock(e.target.value)} min={-1}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Nama Game</label>
                    <input type="text" value={formGameName} onChange={e => setFormGameName(e.target.value)} placeholder="Mobile Legends"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5">Mata Uang</label>
                    <input type="text" value={formCurrency} onChange={e => setFormCurrency(e.target.value)} placeholder="Diamonds"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Status</label>
                  <button type="button" onClick={() => setFormIsActive(!formIsActive)}
                    className={cn('w-full py-3 px-4 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2',
                      formIsActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-surface-container-low text-on-surface-variant border-outline-variant')}>
                    {formIsActive ? <><Eye size={16} /> Aktif</> : <><EyeOff size={16} /> Nonaktif</>}
                  </button>
                </div>
              </div>

              {/* Col 3: Image & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Gambar Produk</label>
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant rounded-xl p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/[0.02] transition-all">
                    {formImagePreview ? (
                      <img src={formImagePreview} alt="Preview" className="w-full h-24 object-contain rounded-lg" />
                    ) : (
                      <>
                        <Upload size={28} className="mx-auto text-on-surface-variant mb-1" />
                        <p className="text-xs text-on-surface-variant">Klik untuk upload • Maks 2MB</p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Deskripsi</label>
                  <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={4}
                    placeholder="Deskripsi produk..."
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-3 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={cn('px-4 py-2 rounded-full text-xs font-semibold transition-all',
                filter === cat ? 'gradient-primary text-white shadow-md' : 'bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary hover:text-primary')}>
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..."
            className="w-full sm:w-64 bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/20">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-outline-variant mb-4" />
            <p className="text-on-surface-variant font-medium">{products.length === 0 ? 'Belum ada produk' : 'Tidak ada produk yang cocok'}</p>
            <p className="text-xs text-on-surface-variant mt-1">{products.length === 0 ? 'Klik "Tambah Produk" untuk menambahkan produk baru.' : 'Coba ubah filter atau kata kunci pencarian.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container/50 border-b border-outline-variant">
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Produk</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Kategori</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Modul</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Harga</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Stok</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-8 h-8 rounded-lg object-cover border border-outline-variant/20" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
                            <ImageIcon size={14} className="text-outline-variant" />
                          </div>
                        )}
                        <span className="text-sm font-semibold text-on-surface">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-sm text-on-surface-variant">{product.category || '-'}</td>
                    <td className="py-3 px-5">
                      <span className="text-xs font-mono bg-surface-container-high px-2 py-1 rounded">{moduleLabel(product.module)}</span>
                    </td>
                    <td className="py-3 px-5 text-sm font-semibold text-on-surface">{formatRupiah(product.price_sell)}</td>
                    <td className="py-3 px-5 text-sm text-on-surface-variant">{product.stock === -1 ? '∞' : product.stock}</td>
                    <td className="py-3 px-5">
                      <button onClick={() => toggleActive(product)}
                        className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer hover:opacity-80 transition-opacity',
                          product.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                        {product.is_active ? <><Eye size={10} /> Aktif</> : <><EyeOff size={10} /> Nonaktif</>}
                      </button>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(product)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => deleteProduct(product.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
