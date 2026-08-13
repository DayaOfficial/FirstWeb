'use client';

import { ApiProductManager } from '@/components/panel/api-product-manager';

export default function PulsaDataTokenPage() {
  return (
    <ApiProductManager
      title="Pulsa, Data & Token"
      categories={['Pulsa', 'Data', 'PLN']}
    />
  );
}
