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
let isInitializing = false;

export async function getDB() {
  if (dbInstance) return dbInstance;
  
  if (isInitializing) {
    return new Promise((resolve, reject) => {
      const checkDB = async () => {
        if (dbInstance) {
          resolve(dbInstance);
        } else if (!isInitializing) {
          reject(new Error('Database initialization failed'));
        } else {
          setTimeout(checkDB, 50);
        }
      };
      checkDB();
    });
  }

  isInitializing = true;

  try {
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
          db.createObjectStore(STORES.CONNECTIONS, { keyPath: 'provider' });
        }
      },
    });
    
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw new Error('Database initialization failed');
  } finally {
    isInitializing = false;
  }
}

// Auth operations
export async function saveAuthUser(user) {
  try {
    const db = await getDB();
    await db.put(STORES.AUTH, { id: 'current-user', ...user });
  } catch (error) {
    console.error('Failed to save auth user:', error);
    throw new Error('Failed to save user authentication');
  }
}

export async function getAuthUser() {
  try {
    const db = await getDB();
    return await db.get(STORES.AUTH, 'current-user');
  } catch (error) {
    console.error('Failed to get auth user:', error);
    return null;
  }
}

export async function clearAuthUser() {
  try {
    const db = await getDB();
    await db.delete(STORES.AUTH, 'current-user');
  } catch (error) {
    console.error('Failed to clear auth user:', error);
    throw new Error('Failed to clear user authentication');
  }
}

// Photo operations
export async function savePhoto(photo) {
  try {
    const db = await getDB();
    await db.put(STORES.PHOTOS, photo);
  } catch (error) {
    console.error('Failed to save photo:', error);
    throw new Error('Failed to save photo');
  }
}

export async function getPhoto(id) {
  try {
    const db = await getDB();
    return await db.get(STORES.PHOTOS, id);
  } catch (error) {
    console.error('Failed to get photo:', error);
    return null;
  }
}

export async function getAllPhotos() {
  try {
    const db = await getDB();
    return await db.getAll(STORES.PHOTOS);
  } catch (error) {
    console.error('Failed to get all photos:', error);
    throw new Error('Failed to load photos');
  }
}

export async function deletePhoto(id) {
  try {
    const db = await getDB();
    await db.delete(STORES.PHOTOS, id);
  } catch (error) {
    console.error('Failed to delete photo:', error);
    throw new Error('Failed to delete photo');
  }
}

export async function getPhotosByTag(tag) {
  try {
    const db = await getDB();
    const index = db.transaction(STORES.PHOTOS).store.index('tags');
    return await index.getAll(tag);
  } catch (error) {
    console.error('Failed to get photos by tag:', error);
    return [];
  }
}

// Album operations
export async function saveAlbum(album) {
  try {
    const db = await getDB();
    await db.put(STORES.ALBUMS, album);
  } catch (error) {
    console.error('Failed to save album:', error);
    throw new Error('Failed to save album');
  }
}

export async function getAllAlbums() {
  try {
    const db = await getDB();
    return await db.getAll(STORES.ALBUMS);
  } catch (error) {
    console.error('Failed to get all albums:', error);
    return [];
  }
}

export async function deleteAlbum(id) {
  try {
    const db = await getDB();
    await db.delete(STORES.ALBUMS, id);
  } catch (error) {
    console.error('Failed to delete album:', error);
    throw new Error('Failed to delete album');
  }
}

// Tag operations
export async function saveTag(tag) {
  try {
    const db = await getDB();
    const count = await getTagCount(tag);
    await db.put(STORES.TAGS, { name: tag, count: count + 1 });
  } catch (error) {
    console.error('Failed to save tag:', error);
    throw new Error('Failed to save tag');
  }
}

export async function getTagCount(tag) {
  try {
    const db = await getDB();
    const entry = await db.get(STORES.TAGS, tag);
    return entry ? entry.count : 0;
  } catch (error) {
    console.error('Failed to get tag count:', error);
    return 0;
  }
}

export async function getAllTags() {
  try {
    const db = await getDB();
    return await db.getAll(STORES.TAGS);
  } catch (error) {
    console.error('Failed to get all tags:', error);
    return [];
  }
}

// Local tag-based search suggestions
export async function searchPhotos(query, limit = 10) {
  try {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const db = await getDB();
    const allTags = await db.getAll(STORES.TAGS);

    return allTags
      .filter((tag) => tag.name.toLowerCase().includes(q))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((tag) => ({ id: tag.name, tags: [tag.name], count: tag.count }));
  } catch (error) {
    console.error('Failed to search photos:', error);
    return [];
  }
}

// Storage connection operations
export async function saveConnection(provider, data) {
  try {
    const db = await getDB();
    await db.put(STORES.CONNECTIONS, { provider, ...data });
  } catch (error) {
    console.error('Failed to save connection:', error);
    throw new Error('Failed to save connection');
  }
}

export async function getConnection(provider) {
  try {
    const db = await getDB();
    return await db.get(STORES.CONNECTIONS, provider);
  } catch (error) {
    console.error('Failed to get connection:', error);
    return null;
  }
}

export async function getAllConnections() {
  try {
    const db = await getDB();
    return await db.getAll(STORES.CONNECTIONS);
  } catch (error) {
    console.error('Failed to get all connections:', error);
    return [];
  }
}

export async function clearConnection(provider) {
  try {
    const db = await getDB();
    await db.delete(STORES.CONNECTIONS, provider);
  } catch (error) {
    console.error('Failed to clear connection:', error);
    throw new Error('Failed to clear connection');
  }
}

// Profile operations
export async function saveProfile(profile) {
  try {
    const db = await getDB();
    await db.put(STORES.PROFILES, profile);
  } catch (error) {
    console.error('Failed to save profile:', error);
    throw new Error('Failed to save profile');
  }
}

export async function getProfile(userId) {
  try {
    const db = await getDB();
    return await db.get(STORES.PROFILES, userId);
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
}

// Database maintenance operations
export async function clearAllData() {
  try {
    const db = await getDB();
    const storeNames = Object.values(STORES);
    
    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
      await tx.complete;
    }
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw new Error('Failed to clear all data');
  }
}

export async function getDatabaseSize() {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get database size:', error);
    return null;
  }
}

export { STORES };