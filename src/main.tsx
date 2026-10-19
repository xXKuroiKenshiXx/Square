import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import "./style.css";
type Info = {
  path: string;
  name: string;
  ext: string;
  bytes: number;
  targets: string[];
};
function App() {
  const [file, setFile] = useState<Info | null>(null),
    [target, setTarget] = useState(""),
    [menu, setMenu] = useState(false),
    [busy, setBusy] = useState(false),
    [drag, setDrag] = useState(false),
    [status, setStatus] = useState(""),
    [done, setDone] = useState(false);
  const busyRef = useRef(false);
  async function load(path: string) {
    if (busyRef.current) return;
    try {
      const f = await invoke<Info>("inspect", { path });
      setFile(f);
      setTarget(f.targets[0] || "");
      setStatus(
        f.targets.length
          ? ""
          : "Este formato todavía no tiene conversiones disponibles.",
      );
      setDone(false);
    } catch (e) {
      setStatus(String(e));
    }
  }
  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;
    let dispose: (() => void) | undefined;
    let gone = false;
    getCurrentWindow()
      .onDragDropEvent((e) => {
        if (e.payload.type === "over") setDrag(true);
        else {
          setDrag(false);
          if (e.payload.type === "drop" && e.payload.paths[0])
            void load(e.payload.paths[0]);
        }
      })
      .then((u) => {
        if (gone) u();
        else dispose = u;
      });
    return () => {
      gone = true;
      dispose?.();
    };
  }, []);
  async function choose() {
    if (busy) return;
    const p = await open({ multiple: false, directory: false });
    if (typeof p === "string") void load(p);
  }
  async function convert() {
    if (!file || !target || busy) return;
    setBusy(true);
    busyRef.current = true;
    setDone(false);
    setMenu(false);
    setStatus("Procesando localmente…");
    try {
      const p = await invoke<string>("convert", { path: file.path, target });
      setDone(true);
      setStatus(`Guardado en ${p}`);
    } catch (e) {
      setStatus(String(e));
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  return (
    <main className={drag ? "shell dragging" : "shell"}>
      <header>
        <div className="brand">
          <i />
          square<span> / convertidor local</span>
        </div>
        <div className="controls">
          <button
            aria-label="Minimizar"
            onClick={() => void getCurrentWindow().minimize()}
          >
            −
          </button>
          <button
            aria-label="Cerrar"
            onClick={() => void getCurrentWindow().close()}
          >
            ×
          </button>
        </div>
      </header>
      <div className="dragbar" data-tauri-drag-region />
      <section>
        <p className="eyebrow">MENOS PASOS. MÁS POSIBILIDADES.</p>
        <h1>
          Cambiá el formato.
          <br />
          <em>Conservá lo esencial.</em>
        </h1>
        <div className="converter">
          <button className="tile input" disabled={busy} onClick={choose}>
            <span className="label">
              ORIGEN <b>↗</b>
            </span>
            <strong>{file?.ext.toUpperCase() || "＋"}</strong>
            <span className="hint">
              {file ? "Cambiar archivo" : "Soltá tu archivo"}
            </span>
          </button>
          <span className={"arrow " + (busy ? "spin" : "")}>⇄</span>
          <div className="output-wrap">
            <button
              className="tile output"
              disabled={!file || busy || !file.targets.length}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <span className="label">
                DESTINO <b>⌄</b>
              </span>
              <strong>{target.toUpperCase() || "?"}</strong>
              <span className="hint">Elegí un formato</span>
            </button>
            {menu && (
              <div
                className="formats"
                role="listbox"
                aria-label="Formato de destino"
              >
                {file?.targets.map((t) => (
                  <button
                    key={t}
                    role="option"
                    aria-selected={t === target}
                    onClick={() => {
                      setTarget(t);
                      setMenu(false);
                      setDone(false);
                      setStatus("");
                    }}
                  >
                    {t.toUpperCase()} {t === target ? "✓" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="fileline">
          {file ? (
            <>
              <span className="file-icon">▤</span>
              <span title={file.path}>{file.name}</span>
              <small>{(file.bytes / 1048576).toFixed(2)} MB</small>
            </>
          ) : (
            <span>Arrastrá un archivo o tocá el bloque de origen</span>
          )}
        </div>
        <button
          className="convert"
          disabled={!target || busy}
          onClick={convert}
        >
          {busy
            ? "Convirtiendo…"
            : done
              ? "Convertir de nuevo"
              : "Convertir archivo"}
          <span>{busy ? "◌" : "↗"}</span>
        </button>
        <p role="status" className={"status " + (done ? "success" : "")}>
          {status || "El resultado se guarda junto al archivo original."}
        </p>
      </section>
      <footer>
        <span>
          <i />
          100% LOCAL
        </span>
        <span>Sin nube. Sin vueltas.</span>
        <span>v0.1</span>
      </footer>
      {drag && (
        <div className="drop-overlay">
          ＋<span>Soltalo acá.</span>
        </div>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
