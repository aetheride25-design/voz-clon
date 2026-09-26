import { LANGUAGE_LABELS, type SynthesisResult } from "../types";
import { Panel } from "./Panel";

interface Props {
  results: SynthesisResult[];
  selectedId: string | null;
  onSelect: (result: SynthesisResult) => void;
}

export function HistoryList({ results, selectedId, onSelect }: Props) {
  if (results.length === 0) return null;
  return (
    <Panel title={`Historial de la sesión (${results.length})`}>
      <ul className="history">
        {results.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={`history__item ${r.id === selectedId ? "history__item--on" : ""}`}
              onClick={() => onSelect(r)}
            >
              <span className="history__text">{r.text}</span>
              <span className="muted">
                {LANGUAGE_LABELS[r.language]} · {r.timings.audio_s.toFixed(1)} s ·{" "}
                {r.createdAt.toLocaleTimeString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
