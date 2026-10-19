import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { FileInfo } from "./types";

function point(radius: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  return {
    x: 210 + radius * Math.cos(angle),
    y: 210 + radius * Math.sin(angle),
  };
}
function xy(radius: number, degrees: number) {
  const p = point(radius, degrees);
  return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
}
export function segmentPath(index: number, count: number) {
  const inner = 78,
    outer = 181,
    corner = 9;
  const center = -90 + (index * 360) / count;
  const half = (360 / count - 4) / 2;
  const start = center - half,
    end = center + half;
  const outerAngle = ((corner / outer) * 180) / Math.PI,
    innerAngle = ((corner / inner) * 180) / Math.PI;
  const outerLarge = end - start - 2 * outerAngle > 180 ? 1 : 0;
  const innerLarge = end - start - 2 * innerAngle > 180 ? 1 : 0;
  return `M${xy(inner + corner, start)} L${xy(outer - corner, start)} Q${xy(outer, start)} ${xy(outer, start + outerAngle)} A${outer},${outer} 0 ${outerLarge} 1 ${xy(outer, end - outerAngle)} Q${xy(outer, end)} ${xy(outer - corner, end)} L${xy(inner + corner, end)} Q${xy(inner, end)} ${xy(inner, end - innerAngle)} A${inner},${inner} 0 ${innerLarge} 0 ${xy(inner, start + innerAngle)} Q${xy(inner, start)} ${xy(inner + corner, start)} Z`;
}
export default function Wheel() {
  const [file, setFile] = useState<FileInfo | null>(null);
  const [page, setPage] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismiss = useCallback(() => {
    void invoke("dismiss_wheel");
  }, []);
  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | undefined;
    function update(info: FileInfo | null) {
      if (!active || !info || busyRef.current) return;
      if (timer.current) clearTimeout(timer.current);
      setFile(info);
      setPage(0);
      setHover(null);
      setDone(false);
      setError("");
    }
    invoke<FileInfo | null>("wheel_context")
      .then(update)
      .catch(() => setError("No se pudo leer el archivo."));
    if ("__TAURI_INTERNALS__" in window)
      listen<FileInfo>("square-wheel", (e) => update(e.payload)).then((u) => {
        if (active) unlisten = u;
        else u();
      });
    return () => {
      active = false;
      unlisten?.();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dismiss]);
  const pages = Math.max(1, Math.ceil((file?.targets.length || 0) / 8));
  const formats = file?.targets.slice(page * 8, page * 8 + 8) || [];
  async function convert(target: string) {
    if (!file || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setDone(false);
    setError("");
    setHover(target);
    try {
      await invoke("convert", { path: file.path, target });
      setDone(true);
      timer.current = setTimeout(dismiss, 1600);
    } catch {
      setError("No se pudo convertir. Probá otro formato.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <main
      className="wheel-root"
      aria-label="Rueda rápida de Square"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <svg
        className="wheel-ring"
        viewBox="0 0 420 420"
        aria-label="Formatos compatibles"
        onClick={(e) => {
          if (e.target === e.currentTarget) dismiss();
        }}
      >
        <defs>
          <filter
            id="wheel-shadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="5"
              floodColor="#120b06"
              floodOpacity=".32"
            />
          </filter>
          <linearGradient id="wheel-glass" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a36c47" stopOpacity=".94" />
            <stop offset="1" stopColor="#75482e" stopOpacity=".92" />
          </linearGradient>
        </defs>
        <circle className="wheel-base" cx="210" cy="210" r="190" />
        {formats.map((format, index) => {
          const label = point(132, -90 + (index * 360) / formats.length);
          return (
            <g
              className={
                "wheel-segment " + (hover === format ? "selected" : "")
              }
              key={format}
              role="button"
              aria-label={`Convertir a ${format.toUpperCase()}`}
              aria-disabled={busy}
              tabIndex={busy ? -1 : 0}
              onMouseEnter={() => {
                if (!busy) setHover(format);
              }}
              onFocus={() => {
                if (!busy) setHover(format);
              }}
              onClick={() => void convert(format)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void convert(format);
                }
              }}
            >
              <path d={segmentPath(index, formats.length)} />
              <text x={label.x} y={label.y} dy=".35em" textAnchor="middle">
                {format.toUpperCase()}
              </text>
            </g>
          );
        })}
        <circle className="wheel-core" cx="210" cy="210" r="70" />
      </svg>
      <div className="wheel-center" aria-live="polite">
        <small>
          {busy
            ? "CONVIRTIENDO"
            : done
              ? "GUARDADO"
              : hover
                ? "CONVERTIR A"
                : "ORIGEN"}
        </small>
        <strong>
          {busy
            ? "◌"
            : done
              ? "✓"
              : (hover || file?.ext || "Square").toUpperCase()}
        </strong>
        {pages > 1 && !busy && !done && (
          <button
            className="wheel-page"
            aria-label="Más formatos"
            onClick={() => {
              setPage((page + 1) % pages);
              setHover(null);
            }}
          >
            {page + 1} / {pages} <span>›</span>
          </button>
        )}
      </div>
      <div className={"wheel-caption " + (error ? "error" : "")} role="status">
        {error ||
          (busy
            ? "Todo ocurre en tu dispositivo."
            : done
              ? "Listo. Junto al original."
              : hover
                ? `Convertir a ${hover.toUpperCase()}`
                : file
                  ? "Elegí un formato · Esc para cerrar"
                  : "Seleccioná un archivo")}
      </div>
    </main>
  );
}
