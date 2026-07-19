import { useState, useEffect } from 'react';
import { getDB } from '../utils/indexedDB';

/**
 * Generic hook for IndexedDB operations on a specific store
 */
export function useIndexedDB(storeName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const items = await db.getAll(storeName);
      setData(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeName]);

  const put = async (item) => {
    try {
      const db = await getDB();
      await db.put(storeName, item);
      await loadAll();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const remove = async (key) => {
    try {
      const db = await getDB();
      await db.delete(storeName, key);
      await loadAll();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const get = async (key) => {
    try {
      const db = await getDB();
      return db.get(storeName, key);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { data, loading, error, put, remove, get, reload: loadAll };
}
