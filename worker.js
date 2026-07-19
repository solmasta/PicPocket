const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 200;

const photoStore = new Map();
const albumStore = new Map();
const tagStore = new Map();
const rateLimitStore = new Map();

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function resolveCorsOrigin(request, env) {
  const requestOrigin = request.headers.get('Origin');
  if (!requestOrigin) return '*';

  const configured = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length === 0) return '*';
  return configured.includes(requestOrigin) ? requestOrigin : configured[0];
}

function withCors(response, corsOrigin) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', corsOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  if (corsOrigin !== '*') {
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function parseJsonBody(request) {
  return request.json().catch(() => null);
}

function applyRateLimit(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || now - current.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { start: now, count: 1 });
    return null;
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    return json({ error: 'Too many requests' }, 429);
  }

  return null;
}

async function verifyAuth(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: json({ error: 'Missing or invalid Authorization header' }, 401) };
  }

  const token = authHeader.slice(7);

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (!response.ok) {
      return { error: json({ error: 'Invalid or expired access token' }, 401) };
    }

    const userInfo = await response.json();
    return {
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: token,
      },
    };
  } catch {
    return { error: json({ error: 'Authentication failed' }, 401) };
  }
}

function getPathParams(pathname, pattern) {
  const pathParts = pathname.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

function parseJsonField(value, fallback, fieldName) {
  if (!value) return { value: fallback };

  try {
    return { value: JSON.parse(value) };
  } catch {
    return { error: json({ error: `${fieldName} must be valid JSON` }, 400) };
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function handleApi(request, url, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const rateLimited = applyRateLimit(request);
  if (rateLimited) return rateLimited;

  const { pathname, searchParams } = url;

  if (request.method === 'GET' && pathname === '/api/health') {
    return json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  if (request.method === 'GET' && pathname === '/api/auth/me') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const { user } = auth;
    return json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  }

  if (request.method === 'GET' && pathname === '/api/photos') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const userPhotos = [];
    for (const photo of photoStore.values()) {
      if (photo.userId === auth.user.id) {
        userPhotos.push(photo);
      }
    }

    userPhotos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    return json(userPhotos);
  }

  if (request.method === 'POST' && pathname === '/api/photos/upload') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return json({ error: 'Invalid multipart form data' }, 400);
    }

    const photoFile = formData.get('photo');
    if (!(photoFile instanceof File)) {
      return json({ error: 'No photo file provided' }, 400);
    }

    if (!ALLOWED_MIME_TYPES.has(photoFile.type)) {
      return json({ error: `Unsupported file type: ${photoFile.type}` }, 400);
    }

    if (photoFile.size > MAX_FILE_SIZE) {
      return json({ error: `File exceeds maximum size of ${MAX_FILE_SIZE} bytes` }, 400);
    }

    const tagsResult = parseJsonField(formData.get('tags'), [], 'tags');
    if (tagsResult.error) return tagsResult.error;

    const locationResult = parseJsonField(formData.get('location'), null, 'location');
    if (locationResult.error) return locationResult.error;

    const buffer = await photoFile.arrayBuffer();

    const photo = {
      id: crypto.randomUUID(),
      userId: auth.user.id,
      fileName: photoFile.name,
      fileSize: photoFile.size,
      mimeType: photoFile.type,
      uploadDate: new Date().toISOString(),
      tags: tagsResult.value,
      location: locationResult.value,
      filter: 'none',
      isPublic: false,
      cloudBackup: { googlePhotos: null, googleDrive: null },
      dataBuffer: arrayBufferToBase64(buffer),
    };

    photoStore.set(photo.id, photo);
    return json({ id: photo.id, fileName: photo.fileName, uploadDate: photo.uploadDate }, 201);
  }

  const photoParams = getPathParams(pathname, '/api/photos/:id');
  if (photoParams && request.method === 'PATCH') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const body = await parseJsonBody(request);
    if (!body) return json({ error: 'Invalid JSON body' }, 400);

    const photo = photoStore.get(photoParams.id);
    if (!photo) return json({ error: 'Photo not found' }, 404);
    if (photo.userId !== auth.user.id) return json({ error: 'Forbidden' }, 403);

    const allowed = new Set(['tags', 'filter', 'isPublic', 'location', 'cloudBackup']);
    for (const [key, value] of Object.entries(body)) {
      if (allowed.has(key)) {
        photo[key] = value;
      }
    }

    photoStore.set(photo.id, photo);
    return json({ id: photo.id });
  }

  if (photoParams && request.method === 'DELETE') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const photo = photoStore.get(photoParams.id);
    if (!photo) return json({ error: 'Photo not found' }, 404);
    if (photo.userId !== auth.user.id) return json({ error: 'Forbidden' }, 403);

    photoStore.delete(photoParams.id);
    return new Response(null, { status: 204 });
  }

  if (request.method === 'GET' && pathname === '/api/albums') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const userAlbums = [];
    for (const album of albumStore.values()) {
      if (album.userId === auth.user.id) {
        userAlbums.push(album);
      }
    }

    return json(userAlbums);
  }

  if (request.method === 'POST' && pathname === '/api/albums') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const body = await parseJsonBody(request);
    if (!body) return json({ error: 'Invalid JSON body' }, 400);

    const { name, photos, isPublic } = body;
    if (!name || !Array.isArray(photos)) {
      return json({ error: 'name and photos are required' }, 400);
    }

    const album = {
      id: crypto.randomUUID(),
      userId: auth.user.id,
      name,
      photos,
      isPublic: Boolean(isPublic),
      createdAt: new Date().toISOString(),
      shareToken: crypto.randomUUID(),
    };

    albumStore.set(album.id, album);
    return json(album, 201);
  }

  const albumParams = getPathParams(pathname, '/api/albums/:id');
  if (albumParams && request.method === 'PATCH') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const body = await parseJsonBody(request);
    if (!body) return json({ error: 'Invalid JSON body' }, 400);

    const album = albumStore.get(albumParams.id);
    if (!album) return json({ error: 'Album not found' }, 404);
    if (album.userId !== auth.user.id) return json({ error: 'Forbidden' }, 403);

    const allowed = new Set(['name', 'photos', 'isPublic']);
    for (const [key, value] of Object.entries(body)) {
      if (allowed.has(key)) {
        album[key] = value;
      }
    }

    albumStore.set(album.id, album);
    return json(album);
  }

  if (albumParams && request.method === 'DELETE') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const album = albumStore.get(albumParams.id);
    if (!album) return json({ error: 'Album not found' }, 404);
    if (album.userId !== auth.user.id) return json({ error: 'Forbidden' }, 403);

    albumStore.delete(albumParams.id);
    return new Response(null, { status: 204 });
  }

  const shareParams = getPathParams(pathname, '/api/albums/share/:shareToken');
  if (shareParams && request.method === 'GET') {
    for (const album of albumStore.values()) {
      if (album.shareToken === shareParams.shareToken) {
        if (!album.isPublic) {
          return json({ error: 'This album is private' }, 403);
        }

        return json({ name: album.name, photos: album.photos });
      }
    }

    return json({ error: 'Album not found' }, 404);
  }

  if (request.method === 'GET' && pathname === '/api/tags') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const userTags = [];
    for (const tag of tagStore.values()) {
      if (tag.userId === auth.user.id) {
        userTags.push(tag);
      }
    }

    userTags.sort((a, b) => b.count - a.count);
    return json(userTags);
  }

  if (request.method === 'GET' && pathname === '/api/tags/search') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const tag = searchParams.get('tag');
    if (!tag) {
      return json({ error: 'tag query parameter is required' }, 400);
    }

    const key = `${auth.user.id}:${tag}`;
    const tagData = tagStore.get(key);
    return json(tagData || { tag, count: 0 });
  }

  if (request.method === 'POST' && pathname === '/api/tags') {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const body = await parseJsonBody(request);
    if (!body) return json({ error: 'Invalid JSON body' }, 400);

    const tag = body.tag;
    if (!tag) {
      return json({ error: 'tag is required' }, 400);
    }

    const key = `${auth.user.id}:${tag}`;
    const existing = tagStore.get(key) || { userId: auth.user.id, tag, count: 0 };
    existing.count += 1;
    tagStore.set(key, existing);
    return json(existing);
  }

  if (
    request.method === 'POST' &&
    (pathname === '/api/ai/autotag' || pathname === '/api/ai/faces' || pathname === '/api/ai/caption')
  ) {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    const body = await parseJsonBody(request);
    if (!body) return json({ error: 'Invalid JSON body' }, 400);

    const { imageData } = body;
    if (!imageData) {
      return json({ error: 'imageData is required' }, 400);
    }

    if (pathname === '/api/ai/autotag') {
      const hour = new Date().getHours();
      const timeTags = [];
      if (hour >= 5 && hour < 12) timeTags.push('morning');
      else if (hour >= 12 && hour < 17) timeTags.push('afternoon');
      else if (hour >= 17 && hour < 21) timeTags.push('evening');
      else timeTags.push('night');

      return json({ tags: ['photo', 'memory', ...timeTags] });
    }

    if (pathname === '/api/ai/faces') {
      return json({
        faces: [],
        message: 'Face detection requires Google Cloud Vision API integration.',
      });
    }

    return json({ caption: 'A beautiful memory captured in this photo.' });
  }

  return json({ error: 'Not found' }, 404);
}

async function serveAssets(request, env) {
  if (!env.ASSETS) {
    return new Response('Static assets binding is not configured', { status: 500 });
  }

  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404) {
    return response;
  }

  if (request.method !== 'GET') {
    return response;
  }

  const accept = request.headers.get('Accept') || '';
  if (!accept.includes('text/html')) {
    return response;
  }

  const url = new URL(request.url);
  const fallbackRequest = new Request(new URL('/index.html', url), request);
  return env.ASSETS.fetch(fallbackRequest);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsOrigin = resolveCorsOrigin(request, env);

    try {
      let response;

      if (url.pathname.startsWith('/api/')) {
        response = await handleApi(request, url, env);
      } else {
        response = await serveAssets(request, env);
      }

      return withCors(response, corsOrigin);
    } catch {
      return withCors(json({ error: 'Internal server error' }, 500), corsOrigin);
    }
  },
};
