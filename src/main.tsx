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
type Menu = "input" | "output" | null;
const groups = [
  {
    name: "Imágenes",
    formats: [
      "png",
      "jpg",
      "webp",
      "svg",
      "heic",
      "avif",
      "gif",
      "bmp",
      "tiff",
      "ico",
      "pnm",
      "tga",
      "dds",
      "qoi",
    ],
  },
  {
    name: "Video",
    formats: [
      "mp4",
      "mkv",
      "mov",
      "webm",
      "avi",
      "mpeg",
      "m4v",
      "wmv",
      "ts",
      "flv",
    ],
  },
  {
    name: "Audio",
    formats: ["mp3", "wav", "aac", "flac", "ogg", "wma", "m4a", "opus", "aiff"],
  },
  {
    name: "Documentos",
    formats: [
      "pdf",
      "docx",
      "md",
      "html",
      "txt",
      "odt",
      "rtf",
      "epub",
      "rst",
      "tex",
    ],
  },
];
const aliases: Record<string, string[]> = {
  jpg: ["jpg", "jpeg"],
  tiff: ["tiff", "tif"],
  heic: ["heic", "heif"],
  md: ["md", "markdown"],
  html: ["html", "htm"],
  tex: ["tex", "latex"],
};
function Chevron() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}
function Arrow() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M5 9h18m-5-5 5 5-5 5M23 19H5m5-5-5 5 5 5" />
    </svg>
  );
}

function App() {
  const [file, setFile] = useState<Info | null>(null);
  const [target, setTarget] = useState("");
  const [menu, setMenu] = useState<Menu>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const busyRef = useRef(false);
  const converterRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLButtonElement>(null);
  const outputRef = useRef<HTMLButtonElement>(null);

  async function load(path: string) {
    if (busyRef.current) return;
    setMenu(null);
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
    } catch {
      setStatus("No se pudo abrir el archivo. Probá seleccionarlo de nuevo.");
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
  useEffect(() => {
    if (!menu) return;
    function outside(e: PointerEvent) {
      if (!converterRef.current?.contains(e.target as Node)) setMenu(null);
    }
    function keyboard(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenu(null);
        (menu === "input" ? inputRef : outputRef).current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, [menu]);

  async function choose(format?: string) {
    if (busyRef.current) return;
    setMenu(null);
    try {
      const p = await open({
        multiple: false,
        directory: false,
        ...(format
          ? {
              filters: [
                {
                  name: format.toUpperCase(),
                  extensions: aliases[format] || [format],
                },
              ],
            }
          : {}),
      });
      if (typeof p === "string") await load(p);
    } catch {
      setStatus("No se pudo abrir el selector de archivos.");
    }
  }
  async function convert() {
    if (!file || !target || busyRef.current) return;
    setBusy(true);
    busyRef.current = true;
    setDone(false);
    setMenu(null);
    setStatus("Procesando en tu dispositivo…");
    try {
      await invoke<string>("convert", { path: file.path, target });
      setDone(true);
      setStatus("Listo. Guardado junto al archivo original.");
    } catch (e) {
      // A converter diagnostic can contain the full source path. Keep filenames out of the interface.
      const message = String(e);
      setStatus(
        message.includes("no compatible")
          ? "Esta conversión no está disponible."
          : message.includes("OCR")
            ? "Este PDF necesita OCR para extraer su texto."
            : message.includes("escribir")
              ? "No se puede guardar en la carpeta del archivo original."
              : "No se pudo convertir. Revisá que el archivo y el formato sean compatibles.",
      );
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  return (
    <main className={drag ? "shell dragging" : "shell"}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header>
        <div className="brand">
          <i aria-hidden="true" />
          square<span>LOCAL CONVERTER</span>
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
        <p className="eyebrow">
          <span /> SIMPLE POR NATURALEZA
        </p>
        <h1>
          Un archivo.
          <br />
          <em>Otra posibilidad.</em>
        </h1>
        <div className="converter" ref={converterRef}>
          <div className="format-wrap">
            <button
              ref={inputRef}
              className="tile input"
              disabled={busy}
              aria-haspopup="dialog"
              aria-expanded={menu === "input"}
              aria-controls="input-formats"
              onClick={() => setMenu(menu === "input" ? null : "input")}
            >
              <span className="label">
                ORIGEN <Chevron />
              </span>
              <strong>{file?.ext.toUpperCase() || "IN"}</strong>
              <span className="hint">
                {file ? "Cambiar formato de entrada" : "Elegí un formato"}
              </span>
            </button>
            {menu === "input" && (
              <div
                id="input-formats"
                className="formats input-menu"
                role="dialog"
                aria-label="Formato de entrada"
              >
                <div className="menu-heading">Formato de entrada</div>
                <button className="browse-any" onClick={() => void choose()}>
                  Seleccionar cualquier archivo <span>↗</span>
                </button>
                <div className="menu-scroll">
                  {groups.map((group) => (
                    <div className="format-group" key={group.name}>
                      <p>{group.name}</p>
                      <div className="format-grid">
                        {group.formats.map((format) => (
                          <button
                            key={format}
                            onClick={() => void choose(format)}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className={"arrow " + (busy ? "spin" : "")}>
            <Arrow />
          </span>
          <div className="format-wrap">
            <button
              ref={outputRef}
              className="tile output"
              disabled={!file || busy || !file.targets.length}
              aria-haspopup="dialog"
              aria-expanded={menu === "output"}
              aria-controls="output-formats"
              onClick={() => setMenu(menu === "output" ? null : "output")}
            >
              <span className="label">
                DESTINO <Chevron />
              </span>
              <strong>{target.toUpperCase() || "OUT"}</strong>
              <span className="hint">Elegí un formato</span>
            </button>
            {menu === "output" && (
              <div
                id="output-formats"
                className="formats output-menu"
                role="dialog"
                aria-label="Formato de destino"
              >
                <div className="menu-heading">Convertir a</div>
                <div className="menu-scroll">
                  <div className="format-grid">
                    {file?.targets.map((t) => (
                      <button
                        key={t}
                        aria-pressed={t === target}
                        onClick={() => {
                          setTarget(t);
                          setMenu(null);
                          setDone(false);
                          setStatus("");
                          outputRef.current?.focus();
                        }}
                      >
                        {t.toUpperCase()}
                        <span>{t === target ? "✓" : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="fileline">
          {file ? (
            <>
              <span className="file-dot" />
              <span>Archivo {file.ext.toUpperCase()} listo</span>
              <small>{(file.bytes / 1048576).toFixed(2)} MB</small>
              <button
                disabled={busy}
                onClick={() => void choose()}
                aria-label="Cambiar archivo"
              >
                Cambiar <span>↗</span>
              </button>
            </>
          ) : (
            <button className="choose-inline" onClick={() => void choose()}>
              Arrastrá tu archivo o <span>seleccionalo acá ↗</span>
            </button>
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
          {status || "Se guarda en la misma carpeta. Así de simple."}
        </p>
      </section>
      <footer>
        <span>
          <i />
          100% LOCAL
        </span>
        <span>Tus archivos se quedan con vos.</span>
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
