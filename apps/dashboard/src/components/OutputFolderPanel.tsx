import type { FolderPermission } from "../hooks/useOutputFolder";
import { Button } from "./Button";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";

interface Props {
  supported: boolean;
  folderName: string | null;
  permission: FolderPermission;
  onChoose: () => void;
  onReconnect: () => void;
}

export function OutputFolderPanel({ supported, folderName, permission, onChoose, onReconnect }: Props) {
  if (!supported) {
    return (
      <Panel title="Carpeta de salida" step={4}>
        <p className="muted">
          Este navegador no permite elegir carpeta. Los audios se descargarán a tu carpeta de descargas.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Carpeta de salida"
      step={4}
      aside={
        <Button onClick={onChoose}>{folderName ? "Cambiar" : "Elegir carpeta"}</Button>
      }
    >
      {!folderName && <p className="muted">Sin carpeta: los audios se descargarán.</p>}
      {folderName && permission === "granted" && (
        <div className="row">
          <StatusPill tone="ok">Guardando en</StatusPill>
          <code className="code">{folderName}</code>
        </div>
      )}
      {folderName && permission === "prompt" && (
        <div className="row">
          <StatusPill tone="warn">Permiso pendiente</StatusPill>
          <code className="code">{folderName}</code>
          <Button variant="primary" onClick={onReconnect}>
            Reconectar
          </Button>
        </div>
      )}
    </Panel>
  );
}
