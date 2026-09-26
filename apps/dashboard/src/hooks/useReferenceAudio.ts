import { useEffect, useState } from "react";

/** Archivo de referencia + URL reproducible + duración. */
export function useReferenceAudio() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      setDuration(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setDuration(null);
    const probe = new Audio(objectUrl);
    probe.onloadedmetadata = () => setDuration(probe.duration);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return { file, url, duration, setFile, clear: () => setFile(null) };
}
