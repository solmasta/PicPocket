/**
 * Content hashing for exact duplicate detection.
 *
 * Hashing the original file bytes (rather than the resized preview PicPocket
 * stores for display) means two uploads of the same photo hash identically
 * even if display-size generation changes later, and the check works fully
 * offline with no AI/network call.
 */
export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
