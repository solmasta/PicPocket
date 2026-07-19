import { openDB } from 'idb';

const DB_NAME = 'picpals-db';
const DB_VERSION = 1;

const STORES = {
  AUTH: 'auth',
  PHOTOS: 'photos',
  ALBUMS: 'albums',
  TAGS: 'tags',
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

export { STORES };
