import { useCallback, useEffect, useState } from "react";
import {
  downloadBlob,
  loadDirectoryHandle,
  pickDirectory,
  queryWritePermission,
  requestWritePermission,
  saveDirectoryHandle,
  supportsDirectoryPicker,
  writeFileToDirectory,
} from "../lib/fileSystem";
import type { SaveTarget } from "../types";

export type FolderPermission = "granted" | "prompt" | "none" | "unsupported";

/**
 * Carpeta local elegida por el usuario. Se recuerda entre recargas; tras recargar,
 * Chromium exige un click para volver a conceder escritura (reconnect).
 * Si el navegador no soporta la API, se cae a descarga normal.
 */
export function useOutputFolder() {
  const supported = supportsDirectoryPicker();
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [permission, setPermission] = useState<FolderPermission>(supported ? "none" : "unsupported");

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    loadDirectoryHandle()
      .then(async (saved) => {
        if (!saved || cancelled) return;
        const state = await queryWritePermission(saved);
        if (cancelled) return;
        setHandle(saved);
        setPermission(state === "granted" ? "granted" : "prompt");
      })
      .catch(() => {
        /* sin handle guardado o IndexedDB no disponible: se queda en "none" */
      });
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const choose = useCallback(async () => {
    try {
      const dir = await pickDirectory();
      setHandle(dir);
      setPermission("granted");
      await saveDirectoryHandle(dir);
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return; // el usuario cerró el diálogo
      throw e;
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (!handle) return;
    const state = await requestWritePermission(handle);
    setPermission(state === "granted" ? "granted" : "prompt");
  }, [handle]);

  const save = useCallback(
    async (name: string, blob: Blob): Promise<SaveTarget> => {
      if (handle && permission === "granted") {
        await writeFileToDirectory(handle, name, blob);
        return "folder";
      }
      downloadBlob(blob, name);
      return "download";
    },
    [handle, permission],
  );

  return { supported, folderName: handle?.name ?? null, permission, choose, reconnect, save };
}
