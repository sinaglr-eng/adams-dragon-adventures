import { freshSave, migrate, type Save } from "./domain";
const DB = "adams-dragon-adventures";
let dbPromise: Promise<IDBDatabase> | undefined;
export function openDB() {
  return (dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("save")) db.createObjectStore("save");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(Error("Close the other game tab and try again."));
  }));
}
let current: Save = freshSave();
let error = "";
let ready = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());
export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const snapshot = () => current;
export const storageStatus = () => ({ ready, error });
export async function initialize() {
  try {
    const db = await openDB();
    const saved = await new Promise<unknown>((resolve, reject) => {
      const req = db.transaction("save").objectStore("save").get("main");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    current = saved ? migrate(saved) : freshSave();
    if (Date.now() - current.session.lastActive > 30 * 60 * 1000)
      current.session = { id: crypto.randomUUID(), lastActive: Date.now() };
    ready = true;
    emit();
    await mutate((s) => {
      s.session = current.session;
    });
  } catch (e) {
    error = String(e);
    ready = true;
    emit();
  }
}
let queue = Promise.resolve();
export function mutate(fn: (s: Save) => void | Save): Promise<void> {
  const work = queue.then(async () => {
    if (error) throw Error(error);
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("save", "readwrite");
      const store = tx.objectStore("save");
      const req = store.get("main");
      let next: Save;
      req.onsuccess = () => {
        try {
          const base = req.result
            ? migrate(req.result)
            : structuredClone(current);
          const result = fn(base);
          next = result ?? base;
          next.revision++;
          next.session.lastActive = Date.now();
          store.put(next, "main");
        } catch (e) {
          tx.abort();
          reject(e);
        }
      };
      tx.oncomplete = () => {
        current = next;
        emit();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? Error("Save interrupted"));
    });
  });
  queue = work.catch((e) => {
    error = String(e);
    emit();
  });
  return work;
}
export async function rawSave() {
  const db = await openDB();
  return new Promise<unknown>((resolve, reject) => {
    const r = db.transaction("save").objectStore("save").get("main");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function recoverWithBackup(input: unknown) {
  const valid = migrate(input);
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("save", "readwrite");
    tx.objectStore("save").put(valid, "main");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  error = "";
  current = valid;
  emit();
}
