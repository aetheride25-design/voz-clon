import type { ServerInfo, SynthesisRequest, Timings } from "../types";

const BASE = "/api";

export async function getHealth(signal?: AbortSignal): Promise<ServerInfo> {
  const res = await fetch(`${BASE}/health`, { signal });
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json() as Promise<ServerInfo>;
}

export async function synthesize(
  req: SynthesisRequest,
  signal?: AbortSignal,
): Promise<{ blob: Blob; timings: Timings }> {
  const form = new FormData();
  form.append("ref_audio", req.refAudio, req.refAudio.name);
  form.append("text", req.text);
  form.append("language", req.language);
  form.append("ref_text", req.mode === "ref_text" ? req.refText : "");
  form.append("x_vector_only", String(req.mode === "x_vector"));

  const res = await fetch(`${BASE}/synthesize`, { method: "POST", body: form, signal });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* cuerpo no JSON: se conserva el status */
    }
    throw new Error(detail);
  }
  const timings = JSON.parse(res.headers.get("X-Timings") ?? "{}") as Timings;
  return { blob: await res.blob(), timings };
}
