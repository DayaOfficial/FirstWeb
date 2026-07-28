'use client';

import { useState } from 'react';

interface BrandImageProps {
  src: string;
  alt: string;
  size?: number;
  rounded?: number;
  disabled?: boolean;
  fallbackText?: string;
  className?: string;
}

export default function BrandImage({
  src,
  alt,
  size = 48,
  rounded = 12,
  disabled = false,
  fallbackText,
  className = '',
}: BrandImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container-high text-on-surface-variant font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, borderRadius: rounded, fontSize: size * 0.35 }}
      >
        {fallbackText?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setError(true)}
      className={`shrink-0 ${disabled ? 'grayscale opacity-50' : ''} ${className}`}
      style={{ borderRadius: rounded, objectFit: 'contain', width: size, height: size }}
    />
  );
}
