import { useState } from "react";
import { Button } from "./components/Button";
import { CloneModePanel } from "./components/CloneModePanel";
import { Header } from "./components/Header";
import { HistoryList } from "./components/HistoryList";
import { OutputFolderPanel } from "./components/OutputFolderPanel";
import { ReferencePanel } from "./components/ReferencePanel";
import { ResultPanel } from "./components/ResultPanel";
import { TextPanel } from "./components/TextPanel";
import { useOutputFolder } from "./hooks/useOutputFolder";
import { useReferenceAudio } from "./hooks/useReferenceAudio";
import { useServerHealth } from "./hooks/useServerHealth";
import { useSynthesis } from "./hooks/useSynthesis";
import type { CloneMode, Language, SynthesisResult } from "./types";

export default function App() {
  const health = useServerHealth();
  const reference = useReferenceAudio();
  const folder = useOutputFolder();
  const synthesis = useSynthesis(folder.save);

  const [mode, setMode] = useState<CloneMode>("ref_text");
  const [refText, setRefText] = useState("");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<Language>("es");
  const [selected, setSelected] = useState<SynthesisResult | null>(null);

  const missing: string[] = [];
  if (health.status !== "ready") missing.push("el modelo");
  if (!reference.file) missing.push("el audio de referencia");
  if (mode === "ref_text" && refText.trim() === "") missing.push("la transcripción");
  if (text.trim() === "") missing.push("el texto");

  const running = synthesis.status === "running";
  const canGenerate = missing.length === 0 && !running;

  const generate = async () => {
    if (!reference.file) return;
    const result = await synthesis.run({ refAudio: reference.file, refText, mode, text, language });
    if (result) setSelected(result);
  };

  return (
    <div className="app">
      <Header status={health.status} info={health.info} />
      <main className="layout">
        <div className="column">
          <ReferencePanel
            file={reference.file}
            url={reference.url}
            duration={reference.duration}
            onFile={reference.setFile}
            onClear={reference.clear}
          />
          <CloneModePanel mode={mode} refText={refText} onModeChange={setMode} onRefTextChange={setRefText} />
          <OutputFolderPanel
            supported={folder.supported}
            folderName={folder.folderName}
            permission={folder.permission}
            onChoose={() => void folder.choose()}
            onReconnect={() => void folder.reconnect()}
          />
        </div>
        <div className="column">
          <TextPanel text={text} language={language} onTextChange={setText} onLanguageChange={setLanguage} />
          <div className="actions">
            <Button variant="primary" className="btn--block" disabled={!canGenerate} onClick={() => void generate()}>
              {running ? "Generando…" : "Generar con mi voz"}
            </Button>
            {!running && missing.length > 0 && (
              <span className="actions__hint">Falta {missing.join(", ")}.</span>
            )}
          </div>
          <ResultPanel status={synthesis.status} error={synthesis.error} result={selected} />
          <HistoryList results={synthesis.results} selectedId={selected?.id ?? null} onSelect={setSelected} />
        </div>
      </main>
    </div>
  );
}
