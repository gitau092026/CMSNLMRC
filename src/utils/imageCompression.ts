/**
 * Utility to compress and resize passport/profile photos in the browser
 * before uploading to Supabase storage.
 * 
 * Typically reduces a 4MB-10MB mobile camera photo down to 30KB-50KB (99% reduction)
 * while preserving high fidelity for 160x160 avatar displays (up to 3x retina).
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const {
    maxWidth = 500,
    maxHeight = 500,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate scale to fit within maxWidth x maxHeight
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context'));
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background in case of transparent PNGs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'));
            return;
          }
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve({ blob, dataUrl, width, height });
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression: ' + err));
    };

    img.src = objectUrl;
  });
}
