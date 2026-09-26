import { LANGUAGE_LABELS, type Language } from "../types";
import { Panel } from "./Panel";

interface Props {
  text: string;
  language: Language;
  onTextChange: (text: string) => void;
  onLanguageChange: (language: Language) => void;
}

const LANGUAGES = Object.keys(LANGUAGE_LABELS) as Language[];

export function TextPanel({ text, language, onTextChange, onLanguageChange }: Props) {
  return (
    <Panel
      title="Texto a generar"
      step={3}
      aside={
        <div className="segmented" role="radiogroup" aria-label="Idioma">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              role="radio"
              aria-checked={language === lang}
              className={`segmented__item ${language === lang ? "segmented__item--on" : ""}`}
              onClick={() => onLanguageChange(lang)}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      }
    >
      <textarea
        className="input input--tall"
        rows={7}
        value={text}
        placeholder="Escribe lo que quieres que diga tu voz…"
        onChange={(e) => onTextChange(e.target.value)}
      />
      <div className="muted right">{text.length} caracteres</div>
    </Panel>
  );
}
