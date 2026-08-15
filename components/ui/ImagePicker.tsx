'use client';

import { createClient } from '@/lib/supabase/client';
import { Image as ImgIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ImagePickerProps {
  /** Current image URL (if any) */
  current?: string | null;
  /** Callback when a new image is uploaded successfully */
  onSaved: (url: string) => void;
  /** Size of the picker in pixels */
  size?: number;
  /** Storage bucket to upload to */
  bucket?: string;
  /** Folder path within the bucket */
  folder?: string;
}

/**
 * ImagePicker — upload/replace product images.
 * Works in both "add product" forms and on existing product rows.
 */
export function ImagePicker({
  current,
  onSaved,
  size = 48,
  bucket = 'brand-logos',
  folder = 'products',
}: ImagePickerProps) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${folder}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) {
        console.error('[ImagePicker] upload error:', error.message);
        alert('Gagal upload: ' + error.message);
        return;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      onSaved(urlData.publicUrl);
    } catch (err: any) {
      console.error('[ImagePicker] unexpected:', err);
      alert('Gagal upload gambar.');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  }

  return (
    <label
      className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-surface-container-high border border-outline-variant/30 overflow-hidden hover:border-primary transition-colors relative"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      title="Upload / ganti gambar"
    >
      {uploading ? (
        <Loader2 size={16} className="text-primary animate-spin" />
      ) : current ? (
        <img
          src={current}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <ImgIcon size={16} className="text-on-surface-variant" />
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
    </label>
  );
}
