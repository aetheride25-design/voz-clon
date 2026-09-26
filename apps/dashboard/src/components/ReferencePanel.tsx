import { useRef, useState, type DragEvent } from "react";
import { formatSeconds } from "../lib/fileName";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Panel } from "./Panel";

interface Props {
  file: File | null;
  url: string | null;
  duration: number | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

const ACCEPT = "audio/*,.aac,.m4a,.mp3,.wav,.flac,.ogg";

export function ReferencePanel({ file, url, duration, onFile, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  return (
    <Panel title="Audio de referencia" step={1} aside={file && <Button onClick={onClear}>Quitar</Button>}>
      {!file ? (
        <div
          className={`dropzone ${dragging ? "dropzone--active" : ""}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
        >
          <div className="dropzone__icon">
            <Icon name="upload" size={22} />
          </div>
          <strong>Arrastra un audio o haz clic</strong>
          <span>3 a 20 segundos de tu voz, sin música de fondo · AAC, MP3, WAV, OGG</span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (picked) onFile(picked);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="reference">
          <div className="reference__meta">
            <div className="reference__icon">
              <Icon name="mic" size={20} />
            </div>
            <div className="reference__text">
              <span className="reference__name">{file.name}</span>
              <span className="muted">
                {(file.size / 1024).toFixed(0)} KB{duration !== null && ` · ${formatSeconds(duration)}`}
              </span>
            </div>
          </div>
          {url && <audio controls src={url} className="audio" />}
        </div>
      )}
    </Panel>
  );
}
