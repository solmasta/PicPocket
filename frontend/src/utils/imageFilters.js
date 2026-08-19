/**
 * Image filter utilities using Canvas API
 */

export const FILTERS = {
  NONE: 'none',
  GRAYSCALE: 'grayscale',
  SEPIA: 'sepia',
  VINTAGE: 'vintage',
  BRIGHT: 'bright',
  CONTRAST: 'contrast',
  BLUR: 'blur',
  SHARPEN: 'sharpen',
  WARM: 'warm',
  COOL: 'cool',
  FADE: 'fade',
  VIGNETTE: 'vignette',
};

export const FILTER_LABELS = {
  [FILTERS.NONE]: 'Original',
  [FILTERS.GRAYSCALE]: 'Grayscale',
  [FILTERS.SEPIA]: 'Sepia',
  [FILTERS.VINTAGE]: 'Vintage',
  [FILTERS.BRIGHT]: 'Bright',
  [FILTERS.CONTRAST]: 'Contrast',
  [FILTERS.BLUR]: 'Blur',
  [FILTERS.SHARPEN]: 'Sharpen',
  [FILTERS.WARM]: 'Warm',
  [FILTERS.COOL]: 'Cool',
  [FILTERS.FADE]: 'Fade',
  [FILTERS.VIGNETTE]: 'Vignette',
};

/**
 * Apply a CSS filter string for preview
 */
export function getCSSFilter(filterName, intensity = 1) {
  switch (filterName) {
    case FILTERS.GRAYSCALE:
      return `grayscale(${intensity})`;
    case FILTERS.SEPIA:
      return `sepia(${intensity})`;
    case FILTERS.VINTAGE:
      return `sepia(0.5) contrast(1.1) brightness(1.1) saturate(0.8)`;
    case FILTERS.BRIGHT:
      return `brightness(${1 + intensity * 0.5})`;
    case FILTERS.CONTRAST:
      return `contrast(${1 + intensity * 0.5})`;
    case FILTERS.BLUR:
      return `blur(${intensity * 3}px)`;
    case FILTERS.WARM:
      return `sepia(0.2) saturate(1.4) hue-rotate(-10deg)`;
    case FILTERS.COOL:
      return `saturate(0.9) hue-rotate(10deg) brightness(1.05)`;
    case FILTERS.FADE:
      return `opacity(${1 - intensity * 0.3}) brightness(1.1) saturate(0.8)`;
    case FILTERS.SHARPEN:
      return `contrast(${1 + intensity * 0.3})`;
    default:
      return 'none';
  }
}

/**
 * Apply filter to an image using Canvas and return a data URL
 */
export function applyFilterToImage(imgElement, filterName, intensity = 1) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;

    ctx.filter = getCSSFilter(filterName, intensity);
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    if (filterName === FILTERS.VIGNETTE) {
      applyVignette(ctx, canvas.width, canvas.height, intensity);
    }

    resolve(canvas.toDataURL('image/jpeg', 0.92));
  });
}

/**
 * Apply vignette effect to canvas context
 */
function applyVignette(ctx, width, height, intensity = 1) {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) / 1.5
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${0.7 * intensity})`);

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Resize an image file and return a data URL
 */
export function resizeImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize an image file down to a small Blob, for sending over the network
 * (e.g. to the AI analyze endpoint) rather than displaying it. Classification
 * and captioning models don't benefit from full resolution, and the
 * server-side cost of turning image bytes into the array Workers AI expects
 * scales with byte count — a stress test showed that shipping a full-size
 * original (up to 20MB) instead of a small version turns into multi-second
 * queuing under concurrent uploads, so this keeps the payload in the tens
 * of KB rather than megabytes.
 */
export function resizeImageToBlob(file, maxDimension = 640, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = maxDimension / Math.max(width, height);
          width = Math.max(1, Math.floor(width * ratio));
          height = Math.max(1, Math.floor(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from a File object
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Create a thumbnail from a data URL.
 *
 * Sized at 480px (well above the ~200-300 CSS px a gallery card actually
 * renders at) so it still looks sharp after the browser multiplies by
 * devicePixelRatio on standard retina/high-DPI screens — a 200px thumbnail
 * upscaled 2-3x for those screens was visibly blurry next to the original.
 */
export function createThumbnail(dataUrl, size = 480) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const { width, height } = img;
      const scale = Math.max(size / width, size / height);
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const offsetX = (size - scaledWidth) / 2;
      const offsetY = (size - scaledHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
