export interface Product {
  id: string;
  name: string;
  category: string;
  module: 'digiflazz' | 'jokerpanel' | 'manual_robux' | 'manual_nokos' | 'manual_app';
  providerCode?: string;
  priceModal: number;
  priceSell: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  inputType?: 'phone' | 'userid_zoneid' | 'link' | 'manual';
  allowDot?: boolean;
  isActive: boolean;
}

export interface ProductPlan {
  id: string;
  productId: string;
  planName: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderCode: string;
  userId?: string;
  productId: string;
  planId?: string;
  module: string;
  amount: number;
  buyerName?: string;
  buyerPhone?: string;
  buyerInput?: string;
  paymentStatus: 'pending' | 'completed' | 'expired' | 'failed';
  processStatus: 'waiting' | 'processing' | 'success' | 'pending' | 'partial' | 'failed' | 'canceled' | 'refunded';
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  imageMobileUrl?: string;
  link?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface NavItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href: string;
}

export interface CategoryTile {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href: string;
  bgColor: string;
  iconColor: string;
  accentColor: string;
}

export interface TrustSignal {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

export interface HowToStep {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  step: number;
  title: string;
  description: string;
}

export interface GameItem {
  id: string;
  name: string;
  publisher: string;
  imageUrl: string;
  badge?: string;
}

/* ─── Nokos Types (Revisi 1) ─── */
export interface NokosApp {
  id: string;
  name: string;
  logoUrl: string;           // base64 or path
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface NokosCountry {
  id: string;
  appId: string;
  countryCode: string;       // 'ID', 'US', 'GB', etc
  countryName: string;
  flagEmoji: string;         // '🇮🇩', '🇺🇸', etc
  price: number;
  stock: number;
  description?: string;
  isActive: boolean;
}

/* ─── FAQ & Contact Types (Revisi 4) ─── */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SocialContact {
  id: string;
  platform: string;          // 'WhatsApp', 'Telegram', 'Instagram', etc
  logoUrl: string;           // base64 or path
  username: string;          // '@dayamart' or '0878-xxx'
  link: string;              // full URL
  actionLabel: string;       // 'Chat' or 'Follow'
  sortOrder: number;
  isActive: boolean;
}

/* ─── Profile Types (Revisi 3) ─── */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;        // base64 or path
  role: 'user' | 'owner';
  approvedAt: string;
  lastLoginAt?: string;
}

export interface TransactionHistory {
  id: string;
  orderCode: string;
  productName: string;
  module: string;
  amount: number;
  status: 'sukses' | 'diproses' | 'pending' | 'gagal' | 'refund' | 'selesai';
  createdAt: string;
}
