const DB_NAME = 'TaskManagerDB';
const DB_VERSION = 1;
const STORE = 'tasks';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: 'dateKey' });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function loadAllTasks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = (e) => {
      const result = {};
      e.target.result.forEach(({ dateKey, tasks }) => { result[dateKey] = tasks; });
      resolve(result);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function saveDateTasks(dateKey, tasks) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put({ dateKey, tasks });
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}
