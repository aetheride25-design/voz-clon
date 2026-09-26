import type { HealthStatus } from "../hooks/useServerHealth";
import type { ServerInfo } from "../types";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";

interface Props {
  status: HealthStatus;
  info: ServerInfo | null;
}

const LABEL: Record<HealthStatus, { tone: "ok" | "warn" | "err"; text: string }> = {
  ready: { tone: "ok", text: "Modelo listo" },
  connecting: { tone: "warn", text: "Cargando modelo…" },
  offline: { tone: "err", text: "Worker sin conexión" },
};

export function Header({ status, info }: Props) {
  const { tone, text } = LABEL[status];
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__mark">
          <Icon name="wave" size={22} />
        </div>
        <div>
          <h1 className="topbar__title">Voz Clon</h1>
          <p className="topbar__sub">Qwen3-TTS 1.7B Base · corriendo en tu máquina</p>
        </div>
      </div>
      <div className="topbar__status">
        <StatusPill tone={tone}>{text}</StatusPill>
        {info && (
          <span className="topbar__device">
            {info.device_name} · {info.dtype}
          </span>
        )}
      </div>
    </header>
  );
}
