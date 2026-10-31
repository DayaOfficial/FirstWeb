'use client';

import { ApiProductManager } from '@/components/panel/api-product-manager';

export default function PulsaDataTokenPage() {
  return (
    <ApiProductManager
      title="Pulsa & Data"
      categories={['Pulsa', 'Data']}
    />
  );
}
