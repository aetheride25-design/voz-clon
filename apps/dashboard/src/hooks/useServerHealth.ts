import { useEffect, useState } from "react";
import { getHealth } from "../api/ttsClient";
import type { ServerInfo } from "../types";

export type HealthStatus = "connecting" | "ready" | "offline";

const POLL_MS = 4000;

/** Sondea /health hasta que el worker responda con el modelo cargado; luego sigue vigilando. */
export function useServerHealth() {
  const [status, setStatus] = useState<HealthStatus>("connecting");
  const [info, setInfo] = useState<ServerInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const controller = new AbortController();

    const tick = async () => {
      try {
        const data = await getHealth(controller.signal);
        if (cancelled) return;
        setInfo(data);
        setStatus(data.loaded ? "ready" : "connecting");
      } catch {
        if (cancelled) return;
        setStatus((s) => (s === "ready" ? "offline" : "connecting"));
      }
      timer = window.setTimeout(tick, POLL_MS);
    };
    void tick();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return { status, info };
}
