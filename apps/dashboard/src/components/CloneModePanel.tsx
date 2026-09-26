import type { CloneMode } from "../types";
import { Panel } from "./Panel";

interface Props {
  mode: CloneMode;
  refText: string;
  onModeChange: (mode: CloneMode) => void;
  onRefTextChange: (text: string) => void;
}

export function CloneModePanel({ mode, refText, onModeChange, onRefTextChange }: Props) {
  return (
    <Panel title="Modo de clonación" step={2}>
      <div className="choice">
        <label className={`choice__item ${mode === "ref_text" ? "choice__item--on" : ""}`}>
          <input type="radio" name="mode" checked={mode === "ref_text"} onChange={() => onModeChange("ref_text")} />
          <span>
            <strong>Con transcripción</strong>
            <small>Mejor calidad. Imita cómo hablas en el audio.</small>
          </span>
        </label>
        <label className={`choice__item ${mode === "x_vector" ? "choice__item--on" : ""}`}>
          <input type="radio" name="mode" checked={mode === "x_vector"} onChange={() => onModeChange("x_vector")} />
          <span>
            <strong>Solo huella de voz</strong>
            <small>Sin transcripción (x-vector). Parecido menor.</small>
          </span>
        </label>
      </div>
      {mode === "ref_text" && (
        <label className="field">
          <span className="field__label">Transcripción exacta del audio de referencia</span>
          <textarea
            className="input"
            rows={3}
            value={refText}
            placeholder="Escribe palabra por palabra lo que dices en el audio…"
            onChange={(e) => onRefTextChange(e.target.value)}
          />
        </label>
      )}
    </Panel>
  );
}
