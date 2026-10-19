import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { QuickSettings } from "./types";

export function shortcutLabel(shortcut: string) {
  return shortcut
    .replace(/Control|Ctrl/g, "Ctrl")
    .replace(/Space/g, "Espacio")
    .replace(/\+/g, " + ");
}
export default function Settings({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (s: QuickSettings) => void;
}) {
  const [settings, setSettings] = useState<QuickSettings>({
    shortcut: "Shift+Space",
    enabled: true,
    registered: false,
    error: null,
    platform: "windows",
  });
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    invoke<QuickSettings>("get_settings")
      .then((s) => {
        if (active) {
          setSettings(s);
          setError(s.error || "");
        }
      })
      .catch(() => {
        if (active) setError("No se pudo leer la configuración.");
      });
    return () => {
      active = false;
    };
  }, []);
  function keyboard(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (recording) setRecording(false);
      else if (!saving) onClose();
      return;
    }
    if (e.key === "Tab" && !recording) {
      const controls = panel.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled)",
      );
      if (controls?.length) {
        const first = controls[0],
          last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }
  function capture(e: KeyboardEvent<HTMLButtonElement>) {
    if (!recording || e.key === "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
    const mods = [
      e.ctrlKey && "Ctrl",
      e.altKey && "Alt",
      e.shiftKey && "Shift",
    ].filter(Boolean);
    const code =
      e.code === "Space"
        ? "Space"
        : e.code.startsWith("Key")
          ? e.code.slice(3)
          : e.code.startsWith("Digit")
            ? e.code.slice(5)
            : e.code;
    if (
      !mods.length ||
      !/^(Space|[A-Z0-9]|F\d{1,2}|Arrow(Up|Down|Left|Right)|Home|End|PageUp|PageDown|Insert|Delete)$/.test(
        code,
      )
    ) {
      setError(
        "Combiná Ctrl, Alt o Shift con una letra, Espacio o una tecla de función.",
      );
      return;
    }
    setSettings((s) => ({ ...s, shortcut: [...mods, code].join("+") }));
    setRecording(false);
    setError("");
  }
  async function save() {
    if (saving || recording) return;
    setSaving(true);
    setError("");
    try {
      const result = await invoke<QuickSettings>("save_settings", {
        settings: { shortcut: settings.shortcut, enabled: settings.enabled },
      });
      onSaved(result);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="settings-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="settings-panel"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Configuración"
        aria-describedby="settings-title"
        onKeyDown={keyboard}
      >
        <div className="settings-top">
          <span className="eyebrow">A TU MANERA</span>
          <button
            className="close-settings"
            aria-label="Cerrar configuración"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>
        <h2 id="settings-title">
          Menos pasos.
          <br />
          <em>Tu propio atajo.</em>
        </h2>
        <p className="settings-description">
          Seleccioná un archivo y abrí la rueda de formatos sin cambiar de
          ventana.
        </p>
        <label className="settings-switch">
          <span>
            Rueda rápida
            <span className="setting-caption">
              Disponible mientras Square está abierto
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) =>
              setSettings((s) => ({ ...s, enabled: e.target.checked }))
            }
            disabled={saving}
          />
        </label>
        <label className="shortcut-title" htmlFor="shortcut-record">
          ATAJO DE TECLADO
        </label>
        <button
          id="shortcut-record"
          className={"shortcut-record " + (recording ? "recording" : "")}
          autoFocus
          disabled={saving}
          onClick={() => {
            setRecording(true);
            setError("");
          }}
          onKeyDown={capture}
        >
          <span>
            {recording
              ? "Presioná tu combinación…"
              : shortcutLabel(settings.shortcut)}
          </span>
          <small>{recording ? "Esc para cancelar" : "Tocá para cambiar"}</small>
        </button>
        <div className="shortcut-presets">
          {["Shift+Space", "Ctrl+Shift+Space", "Ctrl+Alt+C"].map((preset) => (
            <button
              key={preset}
              disabled={saving}
              onClick={() => {
                setSettings((s) => ({ ...s, shortcut: preset }));
                setRecording(false);
                setError("");
              }}
            >
              {shortcutLabel(preset)}
            </button>
          ))}
        </div>
        <p className="settings-note">
          {settings.platform === "windows"
            ? "Funciona con un archivo seleccionado en el Explorador o el Escritorio. Elegí un formato para convertir; Escape cierra la rueda."
            : "En Linux, la rueda usa el archivo cargado en Square. El atajo global depende del escritorio y puede no estar disponible en Wayland."}
        </p>
        <p className="settings-tray-note">
          Al cerrar la ventana, Square sigue en la bandeja. Para terminarlo,
          elegí «Salir de Square» en su menú.
        </p>
        <p className="settings-error" role="status">
          {error}
        </p>
        <button
          className="convert"
          disabled={saving || recording}
          onClick={() => void save()}
        >
          {saving ? "Guardando…" : "Guardar configuración"}
          <span>✓</span>
        </button>
      </div>
    </div>
  );
}
