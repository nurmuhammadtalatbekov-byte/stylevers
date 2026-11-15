const DATABASE = "styleverse-garment-assets";
const STORE = "models";
const VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open garment storage."));
  });
}

export async function saveGarmentAsset(file: File): Promise<string> {
  const id = crypto.randomUUID();
  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save garment."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Garment save was aborted."));
    });
  } finally {
    database.close();
  }

  return id;
}

export async function loadGarmentAsset(id: string): Promise<Blob | undefined> {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(request.error ?? new Error("Could not open saved garment."));
    });
  } finally {
    database.close();
  }
}
