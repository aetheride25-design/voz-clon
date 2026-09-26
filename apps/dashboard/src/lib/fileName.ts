import type { Language } from "../types";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function slug(text: string, max = 40): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

/** Ej.: 20260912-153045_es_hola-esta-es-una-prueba.wav */
export function buildOutputFileName(date: Date, language: Language, text: string): string {
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${stamp}_${language}_${slug(text) || "audio"}.wav`;
}

export function formatSeconds(s: number): string {
  return `${s.toFixed(1)} s`;
}
