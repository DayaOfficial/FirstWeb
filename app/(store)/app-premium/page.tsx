'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Crown } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const categories = ['Semua', 'Streaming', 'Musik', 'Editing', 'Edukasi'];

const apps = [
  { name: 'Netflix', cat: 'Streaming', plans: [{ name: 'Sharing', price: 32000 }, { name: 'Private', price: 65000 }], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXPQDCVCcWq5pRu-i8ZbNdLOB1I66DjF2bFM7UKzdwWPUBWPoepfiqvJsidtL-GFDWADzh1_k5T3nRoSCqwpVx64xgs4Ef-B1WoChEKmshUj0BfZ2DK7CZA8OVPY2_f-fHorFvO0iIQA_p8PzWBxaP4y3TpajtDT0LcIAOKao6Arlu9Ykx28T-B4PaPnEVEvU8TLyYUqlQjanMgzNCLHJmGb4hfxxKc1eyWkAN7mjJLSzjbIq-gFynbcIPuyIHPF51-U1XSQ49En8' },
  { name: 'Spotify', cat: 'Musik', plans: [{ name: '1U', price: 15000 }, { name: '2U', price: 25000 }], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0Q35GzDHaC896KidcF71Agj5-1fjwC3siy84kxRXPwQtYZSiS-Xd1I3sTNL0C8G8PRiRdcI04MH6UnXNVAWdi0izEdzfHiN1KxQ0bgcUSvAEvE59rIEYs-g3LiXlx4bCBawW0roNnufEyid921coGNYKo2SKbMHVMGuH52xwTWDJ1V9diVRW078rQ0BXH4nnr85UNdH0rSfj0DB24spSVMHO7hlzrlFvyP3F41Yetd1-s0uaNFPFI9YfbXuWUxlFa44h9YpJR5tw' },
  { name: 'Canva', cat: 'Editing', plans: [{ name: '1U', price: 20000 }, { name: '5U', price: 45000 }], img: '' },
  { name: 'Disney+', cat: 'Streaming', plans: [{ name: 'Sharing', price: 25000 }, { name: 'Private', price: 50000 }], img: '' },
  { name: 'ChatGPT', cat: 'Edukasi', plans: [{ name: '1U', price: 35000 }], img: '' },
  { name: 'Dramabox', cat: 'Streaming', plans: [{ name: '1U', price: 18000 }], img: '' },
  { name: 'Apple Music', cat: 'Musik', plans: [{ name: '1U', price: 20000 }], img: '' },
  { name: 'CapCut', cat: 'Editing', plans: [{ name: '1U', price: 15000 }], img: '' },
  { name: 'Grammarly', cat: 'Edukasi', plans: [{ name: '1U', price: 30000 }], img: '' },
  { name: 'YouTube Premium', cat: 'Musik', plans: [{ name: '1U', price: 18000 }, { name: 'Sharing', price: 12000 }], img: '' },
  { name: 'HBO Max', cat: 'Streaming', plans: [{ name: 'Sharing', price: 28000 }], img: '' },
  { name: 'Zoom', cat: 'Edukasi', plans: [{ name: '1U', price: 25000 }], img: '' },
];

export default function AppPremiumPage() {
  const [activeCat, setActiveCat] = useState('Semua');
  const [search, setSearch] = useState('');

  const filtered = apps.filter(a => {
    const matchCat = activeCat === 'Semua' || a.cat === activeCat;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">App Premium</span>
      </nav>

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] mb-4 flex items-center gap-2">
          <Crown size={28} /> Aplikasi Premium
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-lg">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari aplikasi..."
              className="w-full bg-surface-container-highest border border-outline-variant rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCat(c)}
                className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${activeCat === c ? 'bg-primary text-white shadow-md' : 'bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary hover:text-primary'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((app, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-2xl shadow-soft shadow-hover-effect border border-outline-variant/30 overflow-hidden flex flex-col group">
            <div className="h-36 bg-surface-container-high relative overflow-hidden flex items-center justify-center">
              {app.img ? (
                <img src={app.img} alt={app.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <span className="text-3xl font-bold text-white/80 font-[family-name:var(--font-heading)]">{app.name[0]}</span>
                </div>
              )}
              <span className="absolute top-2 right-2 bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded-full">{app.cat}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-base text-on-surface mb-3">{app.name}</h3>
              <div className="space-y-2 mt-auto">
                {app.plans.map((plan, j) => (
                  <div key={j} className="flex items-center justify-between bg-surface-container-low rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold text-on-surface-variant">{plan.name}</span>
                    <span className="text-sm font-bold text-primary">{formatRupiah(plan.price)}</span>
                  </div>
                ))}
              </div>
              <Link href="/checkout" className="mt-3 w-full py-2.5 rounded-full gradient-primary text-white text-sm font-semibold text-center block hover:opacity-90 transition-opacity">
                Beli Sekarang
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
