/**
 * Utils/imageProcessing.js
 *
 * Utilities for image manipulation in PicPocket.
 * Provides resize, compress, thumbnail generation, collage creation,
 * and basic filter helpers used throughout the app.
 */

/**
 * Resize an image file to the given maximum dimension while preserving
 * the aspect ratio.
 *
 * @param {File|Blob} imageFile - The source image.
 * @param {number} maxWidth     - Maximum width in pixels.
 * @param {number} maxHeight    - Maximum height in pixels.
 * @param {string} [mimeType]   - Output MIME type (default: source type or 'image/jpeg').
 * @returns {Promise<Blob>}     - Resized image as a Blob.
 */
export async function resizeImage(imageFile, maxWidth, maxHeight, mimeType) {
  const outputType = mimeType || imageFile.type || 'image/jpeg';
  const bitmap = await createImageBitmap(imageFile);

  const { width, height } = bitmap;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  return canvasToBlob(canvas, outputType);
}

/**
 * Compress an image by reducing its JPEG quality.
 *
 * @param {File|Blob} imageFile  - The source image.
 * @param {number}   [quality]   - JPEG quality 0–1 (default: 0.75).
 * @returns {Promise<Blob>}      - Compressed image as a Blob.
 */
export async function compressImage(imageFile, quality = 0.75) {
  const bitmap = await createImageBitmap(imageFile);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return canvasToBlob(canvas, 'image/jpeg', quality);
}

/**
 * Generate a square thumbnail from an image by centre-cropping it.
 *
 * @param {File|Blob} imageFile - The source image.
 * @param {number}   [size]     - Thumbnail side length in pixels (default: 256).
 * @returns {Promise<Blob>}     - Thumbnail as a Blob.
 */
export async function generateThumbnail(imageFile, size = 256) {
  const bitmap = await createImageBitmap(imageFile);
  const { width, height } = bitmap;

  const side = Math.min(width, height);
  const sx = Math.floor((width - side) / 2);
  const sy = Math.floor((height - side) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  return canvasToBlob(canvas, 'image/jpeg', 0.85);
}

/**
 * Create a collage from multiple images arranged in a grid.
 *
 * @param {Array<File|Blob>} imageFiles - Source images (up to 9 recommended).
 * @param {object}           [options]
 * @param {number}           [options.columns=3]    - Number of columns in the grid.
 * @param {number}           [options.cellSize=400] - Each cell's side length in pixels.
 * @param {number}           [options.gap=8]        - Gap between cells in pixels.
 * @param {string}           [options.background]   - Background fill colour (default: '#ffffff').
 * @returns {Promise<Blob>}  - Collage image as a Blob.
 */
export async function createCollage(imageFiles, options = {}) {
  const {
    columns = 3,
    cellSize = 400,
    gap = 8,
    background = '#ffffff',
  } = options;

  const count = imageFiles.length;
  const cols = Math.min(columns, count);
  const rows = Math.ceil(count / cols);

  const canvasWidth = cols * cellSize + (cols - 1) * gap;
  const canvasHeight = rows * cellSize + (rows - 1) * gap;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const bitmaps = await Promise.all(imageFiles.map((f) => createImageBitmap(f)));

  bitmaps.forEach((bitmap, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * (cellSize + gap);
    const y = row * (cellSize + gap);

    // Centre-crop each image into its cell
    const { width, height } = bitmap;
    const scale = Math.max(cellSize / width, cellSize / height);
    const scaledW = width * scale;
    const scaledH = height * scale;
    const offsetX = (scaledW - cellSize) / 2;
    const offsetY = (scaledH - cellSize) / 2;

    ctx.drawImage(bitmap, -offsetX + x, -offsetY + y, scaledW, scaledH);
    bitmap.close();
  });

  return canvasToBlob(canvas, 'image/jpeg', 0.9);
}

/**
 * Apply a simple grayscale filter to an image.
 *
 * @param {File|Blob} imageFile - The source image.
 * @returns {Promise<Blob>}     - Filtered image as a Blob.
 */
export async function applyGrayscale(imageFile) {
  const bitmap = await createImageBitmap(imageFile);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  ctx.filter = 'grayscale(100%)';
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return canvasToBlob(canvas, 'image/jpeg', 0.9);
}

/**
 * Read EXIF orientation from a JPEG Blob and return the rotation in degrees.
 * Returns 0 when orientation cannot be determined.
 *
 * @param {Blob} imageBlob
 * @returns {Promise<number>} - One of 0, 90, 180, 270.
 */
export async function getExifRotation(imageBlob) {
  const buffer = await imageBlob.slice(0, 65536).arrayBuffer();
  const view = new DataView(buffer);

  // Must start with JPEG SOI marker
  if (view.getUint16(0) !== 0xffd8) return 0;

  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    const length = view.getUint16(offset + 2);

    if (marker === 0xffe1) {
      // APP1 segment – check for EXIF header
      const exifHeader = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7),
      );
      if (exifHeader === 'Exif') {
        const tiffOffset = offset + 10;
        const littleEndian = view.getUint16(tiffOffset) === 0x4949;
        const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian) + tiffOffset;
        const entries = view.getUint16(ifdOffset, littleEndian);

        for (let i = 0; i < entries; i++) {
          const entryOffset = ifdOffset + 2 + i * 12;
          const tag = view.getUint16(entryOffset, littleEndian);
          if (tag === 0x0112) {
            const orientation = view.getUint16(entryOffset + 8, littleEndian);
            return ORIENTATION_TO_DEGREES[orientation] ?? 0;
          }
        }
      }
    }

    offset += 2 + length;
  }
  return 0;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const ORIENTATION_TO_DEGREES = {
  1: 0,
  3: 180,
  6: 90,
  8: 270,
};

/**
 * Promisified wrapper around HTMLCanvasElement.toBlob.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string}            type
 * @param {number}            [quality]
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to Blob'));
      },
      type,
      quality,
    );
  });
}
