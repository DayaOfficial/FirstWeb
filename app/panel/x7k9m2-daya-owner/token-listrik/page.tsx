'use client';

import { ApiProductManager } from '@/components/panel/api-product-manager';

export default function TokenListrikPage() {
  return (
    <ApiProductManager
      title="Token Listrik & Tagihan"
      categories={['PLN', 'Tagihan', 'Voucher']}
    />
  );
}
