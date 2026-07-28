'use client';

import { useState, useEffect, useRef } from 'react';
import { HelpCircle, Plus, Edit3, Trash2, X, Upload, ArrowUp, ArrowDown, MessageCircle, Globe } from 'lucide-react';
import BrandImage from '@/components/ui/BrandImage';
import type { FAQItem, SocialContact } from '@/types';

const FAQ_CATEGORIES = ['Umum', 'Pembayaran', 'Topup', 'SMM', 'Nokos', 'App Premium'];

export default function OwnerBantuanPage() {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');

  // FAQ state
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('Umum');
  const [faqActive, setFaqActive] = useState(true);

  // Contact state
  const [contacts, setContacts] = useState<SocialContact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<SocialContact | null>(null);
  const [contactPlatform, setContactPlatform] = useState('');
  const [contactLogo, setContactLogo] = useState('');
  const [contactUsername, setContactUsername] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [contactAction, setContactAction] = useState('Chat');
  const [contactActive, setContactActive] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'faq' | 'contact'; id: string } | null>(null);

  useEffect(() => {
    const f = localStorage.getItem('daya_faqs');
    const c = localStorage.getItem('daya_social_contacts');
    if (f) setFaqs(JSON.parse(f));
    if (c) setContacts(JSON.parse(c));
  }, []);

  const saveFaqs = (data: FAQItem[]) => {
    setFaqs(data);
    localStorage.setItem('daya_faqs', JSON.stringify(data));
  };

  const saveContacts = (data: SocialContact[]) => {
    setContacts(data);
    localStorage.setItem('daya_social_contacts', JSON.stringify(data));
  };

  /* ── FAQ CRUD ── */
  const openAddFaq = () => {
    setEditingFaq(null);
    setFaqQuestion(''); setFaqAnswer(''); setFaqCategory('Umum'); setFaqActive(true);
    setShowFaqModal(true);
  };

  const openEditFaq = (faq: FAQItem) => {
    setEditingFaq(faq);
    setFaqQuestion(faq.question); setFaqAnswer(faq.answer); setFaqCategory(faq.category); setFaqActive(faq.isActive);
    setShowFaqModal(true);
  };

  const handleSaveFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    if (editingFaq) {
      saveFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, question: faqQuestion.trim(), answer: faqAnswer.trim(), category: faqCategory, isActive: faqActive } : f));
    } else {
      const newFaq: FAQItem = {
        id: `faq-${Date.now()}`,
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        category: faqCategory,
        sortOrder: faqs.length,
        isActive: faqActive,
      };
      saveFaqs([...faqs, newFaq]);
    }
    setShowFaqModal(false);
  };

  const deleteFaq = (id: string) => {
    saveFaqs(faqs.filter(f => f.id !== id));
    setDeleteConfirm(null);
  };

  const toggleFaqStatus = (id: string) => {
    saveFaqs(faqs.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
  };

  const moveFaq = (id: string, direction: 'up' | 'down') => {
    const sorted = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(f => f.id === id);
    if (direction === 'up' && idx > 0) {
      const temp = sorted[idx].sortOrder;
      sorted[idx].sortOrder = sorted[idx - 1].sortOrder;
      sorted[idx - 1].sortOrder = temp;
    } else if (direction === 'down' && idx < sorted.length - 1) {
      const temp = sorted[idx].sortOrder;
      sorted[idx].sortOrder = sorted[idx + 1].sortOrder;
      sorted[idx + 1].sortOrder = temp;
    }
    saveFaqs(sorted);
  };

  /* ── Contact CRUD ── */
  const openAddContact = () => {
    setEditingContact(null);
    setContactPlatform(''); setContactLogo(''); setContactUsername(''); setContactLink(''); setContactAction('Chat'); setContactActive(true);
    setShowContactModal(true);
  };

  const openEditContact = (c: SocialContact) => {
    setEditingContact(c);
    setContactPlatform(c.platform); setContactLogo(c.logoUrl); setContactUsername(c.username);
    setContactLink(c.link); setContactAction(c.actionLabel); setContactActive(c.isActive);
    setShowContactModal(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Max 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setContactLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveContact = () => {
    if (!contactPlatform.trim() || !contactUsername.trim() || !contactLink.trim()) return;
    if (editingContact) {
      saveContacts(contacts.map(c => c.id === editingContact.id ? {
        ...c, platform: contactPlatform.trim(), logoUrl: contactLogo, username: contactUsername.trim(),
        link: contactLink.trim(), actionLabel: contactAction, isActive: contactActive
      } : c));
    } else {
      const newContact: SocialContact = {
        id: `sc-${Date.now()}`,
        platform: contactPlatform.trim(),
        logoUrl: contactLogo,
        username: contactUsername.trim(),
        link: contactLink.trim(),
        actionLabel: contactAction,
        sortOrder: contacts.length,
        isActive: contactActive,
      };
      saveContacts([...contacts, newContact]);
    }
    setShowContactModal(false);
  };

  const deleteContact = (id: string) => {
    saveContacts(contacts.filter(c => c.id !== id));
    setDeleteConfirm(null);
  };

  const sortedFaqs = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface font-[family-name:var(--font-heading)] flex items-center gap-2">
          <HelpCircle size={24} /> Bantuan & FAQ
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Kelola FAQ dan informasi kontak untuk halaman bantuan.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container rounded-xl p-1">
        <button onClick={() => setActiveTab('faq')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'faq' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>
          <MessageCircle size={16} /> Kelola FAQ
        </button>
        <button onClick={() => setActiveTab('contact')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'contact' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>
          <Globe size={16} /> Kontak & Sosmed
        </button>
      </div>

      {/* ══ TAB: FAQ ══ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <button onClick={openAddFaq}
            className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2">
            <Plus size={16} /> Tambah Pertanyaan Baru
          </button>

          {sortedFaqs.length === 0 && (
            <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <HelpCircle size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
              <p className="text-sm text-on-surface-variant">Belum ada FAQ.</p>
            </div>
          )}

          <div className="space-y-3">
            {sortedFaqs.map((faq, i) => (
              <div key={faq.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-soft p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{faq.question}</p>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{faq.answer}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/5 text-primary">{faq.category}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${faq.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-gray-100 text-gray-500'}`}>
                        {faq.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveFaq(faq.id, 'up')} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"><ArrowUp size={14} /></button>
                    <button onClick={() => moveFaq(faq.id, 'down')} disabled={i === sortedFaqs.length - 1} className="p-1.5 rounded-lg hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"><ArrowDown size={14} /></button>
                    <button onClick={() => openEditFaq(faq)} className="p-1.5 rounded-lg hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => toggleFaqStatus(faq.id)} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-on-surface-variant hover:text-amber-500 transition-colors text-[10px] font-bold">
                      {faq.isActive ? 'Off' : 'On'}
                    </button>
                    <button onClick={() => setDeleteConfirm({ type: 'faq', id: faq.id })} className="p-1.5 rounded-lg hover:bg-error/5 text-on-surface-variant hover:text-error transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB: Contact ══ */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <button onClick={openAddContact}
            className="px-5 py-2.5 rounded-full gradient-primary text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2">
            <Plus size={16} /> Tambah Media Sosial Baru
          </button>

          {contacts.length === 0 && (
            <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <Globe size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
              <p className="text-sm text-on-surface-variant">Belum ada kontak.</p>
            </div>
          )}

          <div className="space-y-3">
            {contacts.sort((a, b) => a.sortOrder - b.sortOrder).map(contact => (
              <div key={contact.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-soft p-4 flex items-center gap-4">
                <BrandImage src={contact.logoUrl} alt={contact.platform} size={40} rounded={10} fallbackText={contact.platform} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-on-surface">{contact.platform}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${contact.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-gray-100 text-gray-500'}`}>
                      {contact.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{contact.username}</p>
                  <p className="text-xs text-on-surface-variant truncate">{contact.link}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditContact(contact)} className="p-1.5 rounded-lg hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-colors"><Edit3 size={14} /></button>
                  <button onClick={() => setDeleteConfirm({ type: 'contact', id: contact.id })} className="p-1.5 rounded-lg hover:bg-error/5 text-on-surface-variant hover:text-error transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowFaqModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">{editingFaq ? 'Edit FAQ' : 'Tambah FAQ'}</h3>
              <button onClick={() => setShowFaqModal(false)} className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Pertanyaan *</label>
                <input type="text" value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Jawaban *</label>
                <textarea value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)} rows={4}
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Kategori</label>
                <select value={faqCategory} onChange={e => setFaqCategory(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                  {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-on-surface">Status</label>
                <button onClick={() => setFaqActive(!faqActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${faqActive ? 'bg-primary' : 'bg-outline-variant'}`}>
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ left: faqActive ? '22px' : '2px' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowFaqModal(false)} className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">Batal</button>
              <button onClick={handleSaveFaq} disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                className="flex-1 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowContactModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface font-[family-name:var(--font-heading)]">{editingContact ? 'Edit Kontak' : 'Tambah Media Sosial'}</h3>
              <button onClick={() => setShowContactModal(false)} className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Platform *</label>
                <input type="text" value={contactPlatform} onChange={e => setContactPlatform(e.target.value)} placeholder="WhatsApp, Telegram, Instagram..."
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Logo</label>
                <div className="flex items-center gap-3">
                  {contactLogo ? (
                    <div className="relative">
                      <img src={contactLogo} alt="Logo" className="w-12 h-12 object-contain rounded-lg border" />
                      <button onClick={() => setContactLogo('')} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-error text-white rounded-full flex items-center justify-center"><X size={10} /></button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-surface-container-high rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => logoInputRef.current?.click()}>
                      <Upload size={16} className="text-on-surface-variant" />
                    </div>
                  )}
                  <button onClick={() => logoInputRef.current?.click()} className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold hover:border-primary transition-colors">
                    {contactLogo ? 'Ganti' : 'Upload'}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/png,image/svg+xml,image/webp" onChange={handleLogoUpload} className="hidden" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Username / Nomor *</label>
                <input type="text" value={contactUsername} onChange={e => setContactUsername(e.target.value)} placeholder="@dayamart atau 0878-xxx"
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Link *</label>
                <input type="url" value={contactLink} onChange={e => setContactLink(e.target.value)} placeholder="https://wa.me/628xxx"
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Label Tombol</label>
                <select value={contactAction} onChange={e => setContactAction(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl py-2.5 px-4 text-sm bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                  <option value="Chat">Chat</option>
                  <option value="Follow">Follow</option>
                  <option value="Subscribe">Subscribe</option>
                  <option value="Kunjungi">Kunjungi</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-on-surface">Status</label>
                <button onClick={() => setContactActive(!contactActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${contactActive ? 'bg-primary' : 'bg-outline-variant'}`}>
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ left: contactActive ? '22px' : '2px' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowContactModal(false)} className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">Batal</button>
              <button onClick={handleSaveContact} disabled={!contactPlatform.trim() || !contactUsername.trim() || !contactLink.trim()}
                className="flex-1 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-error font-[family-name:var(--font-heading)] mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-on-surface-variant mb-6">Yakin ingin menghapus item ini?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">Batal</button>
              <button onClick={() => deleteConfirm.type === 'faq' ? deleteFaq(deleteConfirm.id) : deleteContact(deleteConfirm.id)}
                className="flex-1 py-2.5 rounded-full bg-error text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
