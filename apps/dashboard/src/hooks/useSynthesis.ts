import { useCallback, useState } from "react";
import { synthesize } from "../api/ttsClient";
import { buildOutputFileName } from "../lib/fileName";
import type { SaveTarget, SynthesisRequest, SynthesisResult } from "../types";

export type SynthesisStatus = "idle" | "running" | "error";

/** Llama al worker, guarda el WAV donde diga `save` y acumula el historial de la sesión. */
export function useSynthesis(save: (name: string, blob: Blob) => Promise<SaveTarget>) {
  const [status, setStatus] = useState<SynthesisStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SynthesisResult[]>([]);

  const run = useCallback(
    async (req: SynthesisRequest): Promise<SynthesisResult | null> => {
      setStatus("running");
      setError(null);
      try {
        const { blob, timings } = await synthesize(req);
        const createdAt = new Date();
        const fileName = buildOutputFileName(createdAt, req.language, req.text);
        const savedTo = await save(fileName, blob);
        const result: SynthesisResult = {
          id: crypto.randomUUID(),
          url: URL.createObjectURL(blob),
          blob,
          timings,
          text: req.text,
          language: req.language,
          createdAt,
          fileName,
          savedTo,
        };
        setResults((prev) => [result, ...prev]);
        setStatus("idle");
        return result;
      } catch (e) {
        setError((e as Error).message);
        setStatus("error");
        return null;
      }
    },
    [save],
  );

  return { status, error, results, run };
}
