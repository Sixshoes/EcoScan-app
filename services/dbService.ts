import { BusinessCardData } from '../types';

const DB_NAME = 'QSHubDB_V1_0';
const DB_VERSION = 6;
const STORE_NAME = 'cards';

let dbInstancePromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  dbInstancePromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbInstancePromise = null;
        };
        db.onclose = () => {
          dbInstancePromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        dbInstancePromise = null;
        reject(request.error);
      };
    } catch (e) {
      dbInstancePromise = null;
      reject(e);
    }
  });

  return dbInstancePromise;
};

export const saveCardToDB = async (card: BusinessCardData): Promise<boolean> => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(card);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const saveAllCardsToDB = async (cards: BusinessCardData[]): Promise<boolean> => {
  if (cards.length === 0) return true;
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (let i = 0; i < cards.length; i++) {
    store.put(cards[i]);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteCardFromDB = async (id: string): Promise<boolean> => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteCardsFromDB = async (ids: string[]): Promise<boolean> => {
  if (ids.length === 0) return true;
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (let i = 0; i < ids.length; i++) {
    store.delete(ids[i]);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const clearAllCardsFromDB = async (): Promise<boolean> => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const getCardsMetadataFromDB = async (): Promise<BusinessCardData[]> => {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      if ('getAll' in store) {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as BusinessCardData[]) || []);
        req.onerror = () => resolve([]);
      } else {
        const items: BusinessCardData[] = [];
        const request = (store as IDBObjectStore).openCursor();
        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            items.push(cursor.value as BusinessCardData);
            cursor.continue();
          } else {
            resolve(items);
          }
        };
        request.onerror = () => resolve([]);
      }
    });
  } catch {
    return [];
  }
};

export const getCardById = async (id: string): Promise<BusinessCardData | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};
