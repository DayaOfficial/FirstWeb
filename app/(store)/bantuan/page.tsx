'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, HelpCircle, ChevronDown, MessageCircle, Search, ExternalLink } from 'lucide-react';
import BrandImage from '@/components/ui/BrandImage';
import { createClient } from '@/lib/supabase/client';
import type { FAQItem, SocialContact } from '@/types';

function getPlatformColor(platform: string) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'WhatsApp': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    'Telegram': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'Instagram': { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
    'TikTok': { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
    'Facebook': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Twitter': { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
    'YouTube': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  };
  return colors[platform] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
}

export default function BantuanPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [contacts, setContacts] = useState<SocialContact[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: faqData } = await supabase.from('faqs').select('*').eq('is_active', true).order('sort_order');
      const { data: contactData } = await supabase.from('social_links').select('*').eq('is_active', true).order('sort_order');

      if (faqData) {
        setFaqs(faqData.map((f: Record<string, unknown>) => ({
          id: f.id as string, question: f.question as string, answer: f.answer as string,
          category: (f.category as string) || 'Umum', sortOrder: (f.sort_order as number) || 0, isActive: true
        })));
      }

      if (contactData) {
        setContacts(contactData.map((c: Record<string, unknown>) => ({
          id: c.id as string, platform: c.platform as string, logoUrl: (c.logo_url as string) || '',
          username: c.username as string, link: c.link as string, actionLabel: (c.action_label as string) || 'Chat',
          sortOrder: (c.sort_order as number) || 0, isActive: true
        })));
      }
    };
    loadData();
  }, []);

  const activeFaqs = faqs
    .filter(f => f.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const filteredFaqs = searchQuery.trim()
    ? activeFaqs.filter(f =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : activeFaqs;

  const activeContacts = contacts
    .filter(c => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Find primary WhatsApp for CTA
  const waContact = activeContacts.find(c => c.platform === 'WhatsApp');

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-semibold">Bantuan</span>
      </nav>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold text-primary font-[family-name:var(--font-heading)] flex items-center justify-center gap-2">
          <HelpCircle size={28} /> Pusat Bantuan
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">Butuh bantuan? Kami siap membantu 24 jam.</p>
      </div>

      {/* ── Hubungi Kami — Social Media Cards ── */}
      {activeContacts.length > 0 && (
        <section className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)] mb-4">Hubungi Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }}>
            {activeContacts.map(contact => {
              const color = getPlatformColor(contact.platform);
              return (
                <div key={contact.id} className={`${color.bg} border ${color.border} rounded-xl p-5 flex flex-col items-center text-center gap-3 shadow-soft hover:shadow-[0px_8px_30px_rgba(192,0,58,0.08)] transition-shadow`}>
                  <BrandImage src={contact.logoUrl} alt={`Logo ${contact.platform}`} size={40} rounded={10} fallbackText={contact.platform} />
                  <div>
                    <h3 className={`font-semibold text-sm ${color.text}`}>{contact.platform}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{contact.username}</p>
                  </div>
                  <a href={contact.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-primary/80 text-primary font-semibold text-xs hover:bg-primary hover:text-white transition-all">
                    <ExternalLink size={12} />
                    {contact.actionLabel}
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FAQ Section ── */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)] mb-4">Pertanyaan Umum (FAQ)</h2>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-on-surface-variant" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan..."
            className="w-full pl-11 pr-4 py-3 border border-outline-variant rounded-xl bg-surface-container-lowest text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, i) => (
            <div key={faq.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-soft overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between text-left group"
              >
                <span className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors pr-4">{faq.question}</span>
                <ChevronDown size={18} className={`text-on-surface-variant shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-180 text-primary' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIdx === i ? 'max-h-96' : 'max-h-0'}`}>
                <p className="px-5 pb-4 text-sm text-on-surface-variant leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{searchQuery ? 'Tidak ada FAQ yang cocok dengan pencarian Anda.' : 'Belum ada pertanyaan. Hubungi kami langsung!'}</p>
          </div>
        )}
      </section>

      {/* ── CTA: Masih butuh bantuan? ── */}
      <div className="max-w-3xl mx-auto bg-surface-container-low rounded-2xl p-8 text-center border border-outline-variant/20">
        <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)] mb-2">Masih butuh bantuan?</h3>
        <p className="text-sm text-on-surface-variant mb-6">Tim kami siap membantu Anda melalui WhatsApp</p>
        <a href={waContact?.link || 'https://wa.me/6287800001232'} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-soft">
          <MessageCircle size={18} />
          Chat WhatsApp
        </a>
      </div>
    </div>
  );
}
