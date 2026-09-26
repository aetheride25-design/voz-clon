/** Acceso a la carpeta de salida elegida por el usuario (File System Access API, Chromium). */

type PermissionMode = "read" | "readwrite";

interface DirectoryHandleWithPermission extends FileSystemDirectoryHandle {
  queryPermission?(opts: { mode: PermissionMode }): Promise<PermissionState>;
  requestPermission?(opts: { mode: PermissionMode }): Promise<PermissionState>;
}

declare global {
  interface Window {
    showDirectoryPicker?(opts?: { mode?: PermissionMode; id?: string }): Promise<FileSystemDirectoryHandle>;
  }
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

export function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!window.showDirectoryPicker) throw new Error("El navegador no soporta elegir carpeta");
  return window.showDirectoryPicker({ mode: "readwrite", id: "tts-output" });
}

export async function queryWritePermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
  const h = handle as DirectoryHandleWithPermission;
  return h.queryPermission ? h.queryPermission({ mode: "readwrite" }) : "granted";
}

/** Debe llamarse desde un gesto del usuario (click). */
export async function requestWritePermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
  const h = handle as DirectoryHandleWithPermission;
  return h.requestPermission ? h.requestPermission({ mode: "readwrite" }) : "granted";
}

export async function writeFileToDirectory(
  dir: FileSystemDirectoryHandle,
  name: string,
  blob: Blob,
): Promise<void> {
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export function downloadBlob(blob: Blob, name: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// --- persistencia del handle entre recargas (IndexedDB) -------------------

const DB_NAME = "tts-dashboard";
const STORE = "handles";
const KEY = "outputDir";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}
