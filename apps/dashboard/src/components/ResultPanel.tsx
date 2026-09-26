import type { SynthesisStatus } from "../hooks/useSynthesis";
import { formatSeconds } from "../lib/fileName";
import type { SynthesisResult } from "../types";
import { Icon } from "./Icon";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";

interface Props {
  status: SynthesisStatus;
  error: string | null;
  result: SynthesisResult | null;
}

export function ResultPanel({ status, error, result }: Props) {
  return (
    <Panel title="Resultado">
      {status === "running" && (
        <div className="progress">
          <span className="spinner" />
          <span>Generando… unos 12 s por cada 10 s de audio en esta GPU.</span>
        </div>
      )}
      {status === "error" && error && <p className="error">{error}</p>}
      {result && status !== "running" && (
        <div className="result">
          <audio controls src={result.url} className="audio" autoPlay />
          <div className="result__row">
            <code className="code">{result.fileName}</code>
            <StatusPill tone={result.savedTo === "folder" ? "ok" : "muted"}>
              {result.savedTo === "folder" ? "Guardado en carpeta" : "Descargado"}
            </StatusPill>
          </div>
          <dl className="timings">
            <div>
              <dt>Audio</dt>
              <dd>{formatSeconds(result.timings.audio_s)}</dd>
            </div>
            <div>
              <dt>Perfil de voz</dt>
              <dd>
                {formatSeconds(result.timings.profile_s)}
                {result.timings.profile_cached && <small> · caché</small>}
              </dd>
            </div>
            <div>
              <dt>Generación</dt>
              <dd>{formatSeconds(result.timings.generate_s)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatSeconds(result.timings.total_s)}</dd>
            </div>
            <div>
              <dt>Velocidad</dt>
              <dd>
                {result.timings.frames_per_s} frames/s
                <small> · {result.timings.codes_per_s} tokens/s</small>
              </dd>
            </div>
            <div>
              <dt>Tiempo real</dt>
              <dd>×{result.timings.realtime_factor}</dd>
            </div>
          </dl>
        </div>
      )}
      {!result && status === "idle" && (
        <div className="empty">
          <div className="empty__icon">
            <Icon name="sparkle" size={22} />
          </div>
          <strong>Aquí aparecerá tu audio</strong>
          <span className="muted">Sube una referencia, escribe el texto y pulsa Generar.</span>
        </div>
      )}
    </Panel>
  );
}
