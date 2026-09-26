export type Language = "es" | "en";
export type CloneMode = "ref_text" | "x_vector";

export const LANGUAGE_LABELS: Record<Language, string> = { es: "Español", en: "English" };

export interface ServerInfo {
  model: string;
  device: string;
  device_name: string;
  dtype: string;
  loaded: boolean;
  languages: Record<string, string>;
}

export interface Timings {
  profile_s: number;
  generate_s: number;
  total_s: number;
  audio_s: number;
  profile_cached: boolean;
  /** frames de audio generados (1 frame = 80 ms, 16 códigos) */
  frames: number;
  frames_per_s: number;
  codes_per_s: number;
  /** segundos de audio por segundo de cómputo; 1 = tiempo real */
  realtime_factor: number;
}

export interface SynthesisRequest {
  refAudio: File;
  refText: string;
  mode: CloneMode;
  text: string;
  language: Language;
}

export type SaveTarget = "folder" | "download";

export interface SynthesisResult {
  id: string;
  url: string;
  blob: Blob;
  timings: Timings;
  text: string;
  language: Language;
  createdAt: Date;
  fileName: string;
  savedTo: SaveTarget;
}
