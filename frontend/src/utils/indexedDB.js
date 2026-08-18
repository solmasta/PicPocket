import { openDB } from 'idb';

const DB_NAME = 'picpals-db';
const DB_VERSION = 3;

const STORES = {
  AUTH: 'auth',
  PHOTOS: 'photos',
  ALBUMS: 'albums',
  TAGS: 'tags',
  PROFILES: 'profiles',
  CONNECTIONS: 'connections',
};

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.AUTH)) {
        db.createObjectStore(STORES.AUTH, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
        const photoStore = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
        photoStore.createIndex('uploadDate', 'uploadDate');
        photoStore.createIndex('tags', 'tags', { multiEntry: true });
      }
      if (!db.objectStoreNames.contains(STORES.ALBUMS)) {
        db.createObjectStore(STORES.ALBUMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.TAGS)) {
        db.createObjectStore(STORES.TAGS, { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains(STORES.PROFILES)) {
        db.createObjectStore(STORES.PROFILES, { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains(STORES.CONNECTIONS)) {
        // Optional storage connections (OneDrive, Dropbox, ...) — separate
        // from the AUTH store because they're additional backup
        // destinations, not the app's sign-in identity. Keyed by provider
        // id ('onedrive', 'dropbox') so there's at most one connection per
        // provider.
        db.createObjectStore(STORES.CONNECTIONS, { keyPath: 'provider' });
      }
    },
  });

  return dbInstance;
}

// Auth operations
export async function saveAuthUser(user) {
  const db = await getDB();
  await db.put(STORES.AUTH, { id: 'current-user', ...user });
}

export async function getAuthUser() {
  const db = await getDB();
  return db.get(STORES.AUTH, 'current-user');
}

export async function clearAuthUser() {
  const db = await getDB();
  await db.delete(STORES.AUTH, 'current-user');
}

// Photo operations
export async function savePhoto(photo) {
  const db = await getDB();
  await db.put(STORES.PHOTOS, photo);
}

export async function getPhoto(id) {
  const db = await getDB();
  return db.get(STORES.PHOTOS, id);
}

export async function getAllPhotos() {
  const db = await getDB();
  return db.getAll(STORES.PHOTOS);
}

export async function deletePhoto(id) {
  const db = await getDB();
  await db.delete(STORES.PHOTOS, id);
}

export async function getPhotosByTag(tag) {
  const db = await getDB();
  const index = db.transaction(STORES.PHOTOS).store.index('tags');
  return index.getAll(tag);
}

// Album operations
export async function saveAlbum(album) {
  const db = await getDB();
  await db.put(STORES.ALBUMS, album);
}

export async function getAllAlbums() {
  const db = await getDB();
  return db.getAll(STORES.ALBUMS);
}

export async function deleteAlbum(id) {
  const db = await getDB();
  await db.delete(STORES.ALBUMS, id);
}

// Tag operations
export async function saveTag(tag) {
  const db = await getDB();
  await db.put(STORES.TAGS, { name: tag, count: (await getTagCount(tag)) + 1 });
}

export async function getTagCount(tag) {
  const db = await getDB();
  const entry = await db.get(STORES.TAGS, tag);
  return entry ? entry.count : 0;
}

export async function getAllTags() {
  const db = await getDB();
  return db.getAll(STORES.TAGS);
}

// Local tag-based search suggestions, used for offline-first autocomplete
// in the search bar (distinct from photoService.searchPhotos, which hits
// the backend for full search results).
export async function searchPhotos(query, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const db = await getDB();
  const allTags = await db.getAll(STORES.TAGS);

  return allTags
    .filter((tag) => tag.name.toLowerCase().includes(q))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((tag) => ({ id: tag.name, tags: [tag.name], count: tag.count }));
}

// Storage connection operations (OneDrive, Dropbox, ...)
export async function saveConnection(provider, data) {
  const db = await getDB();
  await db.put(STORES.CONNECTIONS, { provider, ...data });
}

export async function getConnection(provider) {
  const db = await getDB();
  return db.get(STORES.CONNECTIONS, provider);
}

export async function getAllConnections() {
  const db = await getDB();
  return db.getAll(STORES.CONNECTIONS);
}

export async function clearConnection(provider) {
  const db = await getDB();
  await db.delete(STORES.CONNECTIONS, provider);
}

// Horse profile operations
export async function saveHorseProfile(profile) {
  const db = await getDB();
  await db.put(STORES.PROFILES, profile);
}

export async function getHorseProfile(userId) {
  const db = await getDB();
  return db.get(STORES.PROFILES, userId);
}

export { STORES };
