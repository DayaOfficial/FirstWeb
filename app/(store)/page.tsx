'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2, Crown, Smartphone, Zap, ShieldCheck, Share2, Wallet, Satellite,
  BadgePercent, Headphones, ShoppingCart, ClipboardList, QrCode, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, Flame
} from 'lucide-react';

/* ─── Banner type from database ─── */
interface BannerSlide {
  type: 'image';
  image_url: string;
  image_mobile_url?: string;
  title: string;
  link?: string;
}

type Slide = BannerSlide;

/* ─── Hero Carousel ─── */
function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    // Load banners from database API
    fetch('/api/banners')
      .then(res => res.json())
      .then((data: { image_url: string; image_mobile_url?: string; title: string; link?: string }[]) => {
        if (data && data.length > 0) {
          const bannerSlides: BannerSlide[] = data.map(b => ({
            type: 'image' as const,
            image_url: b.image_url,
            image_mobile_url: b.image_mobile_url || undefined,
            title: b.title,
            link: b.link,
          }));
          setSlides(bannerSlides);
          setCurrent(0);
        }
      })
      .catch(() => { /* no banners */ });
  }, []);

  // Auto-play
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // If no banners, don't render the carousel
  if (slides.length === 0) {
    return (
      <section className="relative rounded-2xl overflow-hidden shadow-soft aspect-[4/3] sm:aspect-[21/9]">
        <div className="w-full h-full flex items-center justify-center gradient-primary text-white relative">
          <div className="absolute inset-0 pattern-circuit" />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl" />
          <div className="relative z-10 text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold leading-tight font-[family-name:var(--font-heading)] tracking-tight">
              DAYA MART
            </h2>
            <p className="text-sm sm:text-base text-white/80">One Stop Digital Store</p>
          </div>
        </div>
      </section>
    );
  }

  const currentSlide = slides[current];

  return (
    <section className="relative rounded-2xl overflow-hidden shadow-soft aspect-[4/3] sm:aspect-[21/9]">
      {currentSlide.type === 'image' && (
        <div className="relative w-full h-full">
          {/* Mobile image (< md) if available, otherwise desktop with center crop */}
          {currentSlide.image_mobile_url ? (
            <picture>
              <source media="(min-width: 768px)" srcSet={currentSlide.image_url} />
              <img
                src={currentSlide.image_mobile_url}
                alt={currentSlide.title}
                className="w-full h-full object-cover object-center transition-opacity duration-500"
              />
            </picture>
          ) : (
            <img
              src={currentSlide.image_url}
              alt={currentSlide.title}
              className="w-full h-full object-cover object-center transition-opacity duration-500"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Nav Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden sm:flex z-20"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrent((p) => (p + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden sm:flex z-20"
            aria-label="Slide berikutnya"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-pink-500 w-6' : 'bg-white/40'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Trust Signals ─── */
function TrustSignals() {
  const signals = [
    { icon: BadgePercent, title: 'Harga Terbaik', desc: 'Termurah di pasaran', bg: 'bg-secondary/10', color: 'text-secondary' },
    { icon: Zap, title: 'Proses Cepat', desc: 'Otomatis 24/7', bg: 'bg-tertiary/10', color: 'text-tertiary' },
    { icon: ShieldCheck, title: 'Aman & Terpercaya', desc: 'Transaksi 100% aman', bg: 'bg-accent-yellow/20', color: 'text-amber-600' },
    { icon: Headphones, title: 'Layanan 24 Jam', desc: 'CS siap membantu', bg: 'bg-primary/10', color: 'text-primary' },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-container-lowest p-4 md:p-6 rounded-2xl shadow-soft border border-outline-variant/30">
      {signals.map((s, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className={`p-3 ${s.bg} ${s.color} rounded-full shrink-0`}>
            <s.icon size={22} />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-on-surface">{s.title}</h4>
            <p className="text-xs text-on-surface-variant">{s.desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─── Category Grid ─── */
function CategoryGrid() {
  const categories = [
    { icon: Gamepad2, label: 'Top Up Game', href: '/topup-game', bg: 'bg-pink-50', color: 'text-pink-500', accent: 'bg-pink-500' },
    { icon: Crown, label: 'App Premium', href: '/app-premium', bg: 'bg-purple-50', color: 'text-accent-purple', accent: 'bg-accent-purple' },
    { icon: Smartphone, label: 'Pulsa & Data', href: '/pulsa-data', bg: 'bg-blue-50', color: 'text-accent-blue', accent: 'bg-accent-blue' },
    { icon: Zap, label: 'Token Listrik', href: '/token-tagihan', bg: 'bg-amber-50', color: 'text-amber-500', accent: 'bg-amber-500' },
    { icon: ShieldCheck, label: 'Nokos', href: '/nokos', bg: 'bg-green-50', color: 'text-accent-green', accent: 'bg-accent-green' },
    { icon: Share2, label: 'Sosial Media', href: '/smm-panel', bg: 'bg-pink-50', color: 'text-magenta-600', accent: 'bg-magenta-600' },
    { icon: Wallet, label: 'E-Wallet', href: '/ewallet', bg: 'bg-purple-50', color: 'text-accent-purple', accent: 'bg-accent-purple' },

  ];

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] text-on-surface">Kategori Produk</h3>
        <p className="text-sm text-on-surface-variant mt-1">Pilih layanan yang Anda butuhkan</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
          <Link
            key={i}
            href={cat.href}
            className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest p-5 border border-outline-variant/50 shadow-soft shadow-hover-effect flex flex-col items-center justify-center text-center gap-3 aspect-square"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/3 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500" />
            <div className={`p-4 ${cat.bg} ${cat.color} rounded-xl group-hover:${cat.accent} group-hover:text-white transition-colors duration-300`}>
              <cat.icon size={28} />
            </div>
            <h4 className="font-semibold text-sm text-on-surface">{cat.label}</h4>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Best Sellers ─── */
function BestSellers() {
  const products = [
    { cat: 'Mobile Legends', name: '86 Diamonds (78 + 8 Bonus)', oldPrice: 25000, price: 22500, badge: 'HOT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrom_mYQxZovoPHeuolKjy39Vwo-DzGNb5uUHWIAPUf9pvhA_F_4fIhkf96HRlOz9YnyJIbSp892GIomPONwSKOTNlzAnQIM49oC8fEDnxjWCE3YMs-GOAkiceGqyn4sqS4pRv5XmJs7AjRBtcK0mGPA9XLtZ_4rU1b4eNWIghqsPUZtx6sEdJJJO_7bhTww4APWWWoQZ6eB0f-V26yF9uB9X8eA2ki6jsWkyIv1f7Tjgn1lHC9YGrVk7ssNMxswR65AhkK4bKZlE' },
    { cat: 'Spotify', name: 'Premium 1 Bulan (Resmi)', oldPrice: 54990, price: 35000, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0Q35GzDHaC896KidcF71Agj5-1fjwC3siy84kxRXPwQtYZSiS-Xd1I3sTNL0C8G8PRiRdcI04MH6UnXNVAWdi0izEdzfHiN1KxQ0bgcUSvAEvE59rIEYs-g3LiXlx4bCBawW0roNnufEyid921coGNYKo2SKbMHVMGuH52xwTWDJ1V9diVRW078rQ0BXH4nnr85UNdH0rSfj0DB24spSVMHO7hlzrlFvyP3F41Yetd1-s0uaNFPFI9YfbXuWUxlFa44h9YpJR5tw' },
    { cat: 'Netflix', name: 'Sharing 1 Bulan (4K UHD)', oldPrice: 45000, price: 32000, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXPQDCVCcWq5pRu-i8ZbNdLOB1I66DjF2bFM7UKzdwWPUBWPoepfiqvJsidtL-GFDWADzh1_k5T3nRoSCqwpVx64xgs4Ef-B1WoChEKmshUj0BfZ2DK7CZA8OVPY2_f-fHorFvO0iIQA_p8PzWBxaP4y3TpajtDT0LcIAOKao6Arlu9Ykx28T-B4PaPnEVEvU8TLyYUqlQjanMgzNCLHJmGb4hfxxKc1eyWkAN7mjJLSzjbIq-gFynbcIPuyIHPF51-U1XSQ49En8' },
    { cat: 'PLN', name: 'Token Listrik 50.000', oldPrice: 51500, price: 50500, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2hHqR7vQCXHT3Vcox12cFegvMkJUcdc9dClrpFJ1t6NPrqjCY5Fe9vRqdP7Zz8WwGVPbEtAkBMiiBR26ErZLLhy9B3UM36KdHcgy0arrX9udu_GlSKqlAOu1dcJQeyKgspByNjCU0LQ9KHPOcUIS36dvYZNR1_mHI-htgBTn7lFpfQO5fThgWzOdM_EW0CAkKoOscGdwS-Rg_O3PUF2J8dRGDr5_1R9Eng2h2I2HnpBcHXoA6hJY0Zg25p3yC5CVH6nEh0piYnBk' },
  ];

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between border-b border-outline-variant pb-3">
        <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] text-primary flex items-center gap-2">
          <Flame size={22} className="text-primary" />
          Produk Terlaris
        </h3>
        <Link href="/topup-game" className="font-semibold text-secondary hover:underline flex items-center text-sm">
          Lihat Semua <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-2xl shadow-soft shadow-hover-effect overflow-hidden border border-outline-variant/30 flex flex-col relative group">
            {p.badge && (
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">{p.badge}</span>
              </div>
            )}
            <div className="h-40 bg-surface-container-high relative overflow-hidden">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-xs font-semibold text-secondary mb-1">{p.cat}</p>
              <h4 className="font-semibold text-sm text-on-surface flex-1 leading-tight mb-2">{p.name}</h4>
              <div className="mt-auto">
                <p className="text-xs text-on-surface-variant line-through mb-0.5">Rp {fmt(p.oldPrice)}</p>
                <p className="text-lg font-bold text-primary font-[family-name:var(--font-heading)]">Rp {fmt(p.price)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── How To Order ─── */
function HowToOrder() {
  const steps = [
    { icon: ShoppingCart, step: 1, title: 'Pilih Produk', desc: 'Pilih layanan atau game yang ingin Anda beli.' },
    { icon: ClipboardList, step: 2, title: 'Isi Data', desc: 'Masukkan User ID / Nomor Tujuan dengan benar.' },
    { icon: QrCode, step: 3, title: 'Bayar QRIS', desc: 'Scan & bayar via QRIS dari e-wallet atau m-banking.' },
    { icon: CheckCircle2, step: 4, title: 'Selesai', desc: 'Pesanan akan diproses otomatis dalam hitungan detik.' },
  ];

  return (
    <section className="bg-surface-container-low rounded-2xl p-8 lg:p-12 shadow-sm border border-outline-variant/20">
      <div className="text-center mb-10">
        <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] text-on-surface">Cara Pemesanan</h3>
        <p className="text-sm text-on-surface-variant mt-2">4 Langkah mudah bertransaksi di DAYA MART</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative">
        {/* Connecting Line */}
        <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-outline-variant/50 -z-10" />
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center group relative z-10">
            <div className="w-16 h-16 rounded-full bg-surface-container-lowest border-2 border-outline-variant flex items-center justify-center text-on-surface-variant group-hover:border-primary group-hover:text-primary transition-colors shadow-sm mb-4 relative">
              <s.icon size={28} />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full text-xs font-bold flex items-center justify-center">{s.step}</div>
            </div>
            <h4 className="font-semibold text-sm text-on-surface mb-2">{s.title}</h4>
            <p className="text-xs text-on-surface-variant">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Home Page ─── */
export default function HomePage() {
  return (
    <div className="space-y-10 lg:space-y-16">
      <HeroCarousel />
      <TrustSignals />
      <CategoryGrid />
      <BestSellers />
      <HowToOrder />
    </div>
  );
}
