// Album share links must work on a device that never created the album
// locally (IndexedDB is per-browser, there's no server to look albums up
// on). So the link carries a self-contained snapshot of the public album
// in the URL fragment: the fragment isn't sent to any server, so a static
// (gh-pages) deploy can still serve it entirely client-side.

export function encodeSharePayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return encodeURIComponent(btoa(binary));
}

export function decodeSharePayload(encoded) {
  try {
    const binary = atob(decodeURIComponent(encoded));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
