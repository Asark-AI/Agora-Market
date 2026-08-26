const DB_NAME = 'agora-offline';
const STORE_NAME = 'state';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open offline storage.'));
  });
}

export const indexedDbStorage = {
  getItem: async (name: string) => {
    if (typeof indexedDB === 'undefined') return null;
    const database = await openDatabase();
    return new Promise<string | null>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(name);
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  },
  setItem: async (name: string, value: string) => {
    if (typeof indexedDB === 'undefined') return;
    const database = await openDatabase();
    return new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  removeItem: async (name: string) => {
    if (typeof indexedDB === 'undefined') return;
    const database = await openDatabase();
    return new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};

export type OfflineAction = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
};

export async function enqueueOfflineAction(type: string, payload: Record<string, unknown>) {
  if (typeof indexedDB === 'undefined') return;
  const database = await openDatabase();
  const key = 'offline-actions';
  const current = await indexedDbStorage.getItem(key);
  const actions = current ? JSON.parse(current) as OfflineAction[] : [];
  if (actions.some((action) => action.type === type && JSON.stringify(action.payload) === JSON.stringify(payload))) return;
  actions.push({ id: crypto.randomUUID(), type, payload, createdAt: Date.now(), attempts: 0, nextAttemptAt: Date.now() });
  await indexedDbStorage.setItem(key, JSON.stringify(actions));
}

export async function getOfflineActions() {
  const current = await indexedDbStorage.getItem('offline-actions');
  return current ? JSON.parse(current) as OfflineAction[] : [];
}

export async function removeOfflineAction(id: string) {
  const actions = await getOfflineActions();
  await indexedDbStorage.setItem('offline-actions', JSON.stringify(actions.filter((action) => action.id !== id)));
}

export async function updateOfflineAction(action: OfflineAction) {
  const actions = await getOfflineActions();
  await indexedDbStorage.setItem('offline-actions', JSON.stringify(actions.map((item) => item.id === action.id ? action : item)));
}
