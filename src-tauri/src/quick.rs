use super::Info;
use serde::{Deserialize, Serialize};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[derive(Clone, Serialize, Deserialize)]
pub struct Settings {
    pub shortcut: String,
    pub enabled: bool,
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            shortcut: "Shift+Space".into(),
            enabled: true,
        }
    }
}
pub struct QuickState {
    settings: Mutex<Settings>,
    context: Mutex<Option<Info>>,
    error: Mutex<Option<String>>,
    opening: AtomicBool,
    tray_available: AtomicBool,
    pub converting: AtomicBool,
}
#[derive(Serialize)]
pub struct SettingsView {
    shortcut: String,
    enabled: bool,
    registered: bool,
    error: Option<String>,
    platform: String,
}
fn settings_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    Ok(app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("settings.json"))
}
fn persist(app: &tauri::AppHandle, settings: &Settings) -> Result<(), String> {
    use std::io::Write;
    let path = settings_path(app)?;
    let parent = path.parent().ok_or("Carpeta de configuración inválida")?;
    std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let mut file = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    file.write_all(&serde_json::to_vec_pretty(settings).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    file.persist(path).map_err(|e| e.to_string())?;
    Ok(())
}
pub fn remember(app: &tauri::AppHandle, info: &Info) {
    if let Some(state) = app.try_state::<QuickState>() {
        if let Ok(mut context) = state.context.lock() {
            *context = Some(info.clone());
        }
    }
}
pub fn show_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
pub fn open_path(app: &tauri::AppHandle, path: String) -> Result<(), String> {
    let info = super::inspect_file(path)?;
    if info.targets.is_empty() {
        return Err("Ese formato todavía no tiene conversiones disponibles.".into());
    }
    remember(app, &info);
    let window = app
        .get_webview_window("wheel")
        .ok_or("No se pudo abrir la rueda")?;
    if let Ok(cursor) = app.cursor_position() {
        let mut x = cursor.x as i32 - 210;
        let mut y = cursor.y as i32 - 210;
        if let Ok(monitors) = app.available_monitors() {
            if let Some(monitor) = monitors.into_iter().find(|m| {
                let p = m.position();
                let s = m.size();
                cursor.x >= p.x as f64
                    && cursor.y >= p.y as f64
                    && cursor.x < (p.x + s.width as i32) as f64
                    && cursor.y < (p.y + s.height as i32) as f64
            }) {
                let area = monitor.work_area();
                let size = (420.0 * monitor.scale_factor()) as i32;
                x = (cursor.x as i32 - size / 2).clamp(
                    area.position.x,
                    (area.position.x + area.size.width as i32 - size).max(area.position.x),
                );
                y = (cursor.y as i32 - size / 2).clamp(
                    area.position.y,
                    (area.position.y + area.size.height as i32 - size).max(area.position.y),
                );
            }
        }
        let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
    }
    window
        .emit("square-wheel", &info)
        .map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}
pub fn activate(app: &tauri::AppHandle) {
    let state = app.state::<QuickState>();
    if let Some(window) = app.get_webview_window("wheel") {
        if window.is_visible().unwrap_or(false) && !state.converting.load(Ordering::SeqCst) {
            let _ = window.hide();
            return;
        }
    }
    if state.converting.load(Ordering::SeqCst) || state.opening.swap(true, Ordering::SeqCst) {
        return;
    }
    let foreground = super::selection::foreground();
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(windows)]
        let path = super::selection::selected_file(foreground);
        #[cfg(not(windows))]
        let path = {
            let _ = foreground;
            app.state::<QuickState>()
                .context
                .lock()
                .map_err(|_| "No se pudo leer el archivo".to_string())
                .and_then(|file| {
                    file.as_ref()
                        .map(|f| f.path.clone())
                        .ok_or("Primero cargá un archivo en Square para usar la rueda.".into())
                })
        };
        let result = path.and_then(|path| open_path(&app, path));
        app.state::<QuickState>()
            .opening
            .store(false, Ordering::SeqCst);
        if let Err(message) = result {
            show_main(&app);
            let _ = app.emit_to("main", "square-notice", message);
        }
    });
}
#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> Result<SettingsView, String> {
    let state = app.state::<QuickState>();
    let settings = state.settings.lock().map_err(|e| e.to_string())?.clone();
    let error = state.error.lock().map_err(|e| e.to_string())?.clone();
    Ok(SettingsView {
        registered: app
            .global_shortcut()
            .is_registered(settings.shortcut.as_str()),
        shortcut: settings.shortcut,
        enabled: settings.enabled,
        error,
        platform: std::env::consts::OS.into(),
    })
}
#[tauri::command]
pub fn save_settings(app: tauri::AppHandle, settings: Settings) -> Result<SettingsView, String> {
    let shortcut = validate_shortcut(&settings.shortcut)?;
    let state = app.state::<QuickState>();
    let old = state.settings.lock().map_err(|e| e.to_string())?.clone();
    let old_registered = app.global_shortcut().is_registered(old.shortcut.as_str());
    let new_registration =
        settings.enabled && (!old_registered || settings.shortcut != old.shortcut);
    if new_registration {
        app.global_shortcut().register(shortcut).map_err(|_| {
            "Ese atajo está ocupado o no está disponible. Probá otra combinación.".to_string()
        })?;
    }
    if let Err(error) = persist(&app, &settings) {
        if new_registration {
            let _ = app.global_shortcut().unregister(shortcut);
        }
        return Err(error);
    }
    if old_registered && (!settings.enabled || settings.shortcut != old.shortcut) {
        if app
            .global_shortcut()
            .unregister(old.shortcut.as_str())
            .is_err()
        {
            let _ = persist(&app, &old);
            if new_registration {
                let _ = app.global_shortcut().unregister(shortcut);
            }
            return Err(
                "No se pudo cambiar el atajo. Se conservó la configuración anterior.".into(),
            );
        }
    }
    *state.settings.lock().map_err(|e| e.to_string())? = settings;
    *state.error.lock().map_err(|e| e.to_string())? = None;
    get_settings(app)
}
fn validate_shortcut(value: &str) -> Result<tauri_plugin_global_shortcut::Shortcut, String> {
    let shortcut: tauri_plugin_global_shortcut::Shortcut = value
        .parse()
        .map_err(|_| "Elegí una combinación válida, por ejemplo Shift+Space.".to_string())?;
    if shortcut.mods.is_empty() {
        return Err(
            "El atajo debe incluir Shift, Ctrl o Alt para no interceptar la escritura normal."
                .into(),
        );
    }
    Ok(shortcut)
}
#[tauri::command]
pub fn wheel_context(app: tauri::AppHandle) -> Result<Option<Info>, String> {
    Ok(app
        .state::<QuickState>()
        .context
        .lock()
        .map_err(|e| e.to_string())?
        .clone())
}
#[tauri::command]
pub fn open_wheel(app: tauri::AppHandle, path: String) -> Result<(), String> {
    open_path(&app, path)
}
#[tauri::command]
pub fn dismiss_wheel(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("wheel") {
        let _ = window.hide();
    }
}
pub fn window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    match event {
        tauri::WindowEvent::CloseRequested { api, .. } if window.label() == "main" => {
            if window
                .app_handle()
                .state::<QuickState>()
                .tray_available
                .load(Ordering::SeqCst)
            {
                api.prevent_close();
                let _ = window.hide();
            } else {
                window.app_handle().exit(0);
            }
        }
        tauri::WindowEvent::Focused(false) if window.label() == "wheel" => {
            let _ = window.hide();
        }
        _ => {}
    }
}
pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let settings = settings_path(app.handle())
        .ok()
        .and_then(|path| std::fs::read(path).ok())
        .and_then(|bytes| serde_json::from_slice::<Settings>(&bytes).ok())
        .unwrap_or_default();
    app.manage(QuickState {
        settings: Mutex::new(settings.clone()),
        context: Mutex::new(None),
        error: Mutex::new(None),
        opening: AtomicBool::new(false),
        tray_available: AtomicBool::new(false),
        converting: AtomicBool::new(false),
    });
    if settings.enabled {
        if let Err(error) = app.global_shortcut().register(settings.shortcut.as_str()) {
            *app.state::<QuickState>().error.lock().unwrap() =
                Some(format!("No se pudo activar el atajo: {error}"));
        }
    }
    use tauri::{
        menu::{Menu, MenuItem},
        tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    };
    let show = MenuItem::with_id(app, "show", "Abrir Square", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "settings", "Configuración", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Salir de Square", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &settings_item, &quit])?;
    let mut tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Square · Rueda rápida")
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => show_main(app),
            "settings" => {
                show_main(app);
                let _ = app.emit_to("main", "square-settings", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    match tray.build(app) {
        Ok(_) => app
            .state::<QuickState>()
            .tray_available
            .store(true, Ordering::SeqCst),
        Err(error) => eprintln!("Tray unavailable: {error}"),
    }
    if let Some(path) = std::env::args()
        .skip(1)
        .find(|path| std::path::Path::new(path).is_file())
    {
        let _ = open_path(app.handle(), path);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_typing_keys_and_invalid_shortcuts() {
        assert!(validate_shortcut("A").is_err());
        assert!(validate_shortcut("Shift").is_err());
        assert!(validate_shortcut("not-a-shortcut").is_err());
        assert!(validate_shortcut("Shift+Space").is_ok());
        assert!(validate_shortcut("Ctrl+Alt+C").is_ok());
    }
    #[test]
    fn preferences_round_trip() {
        let settings = Settings {
            shortcut: "Ctrl+Shift+K".into(),
            enabled: false,
        };
        let bytes = serde_json::to_vec(&settings).unwrap();
        let restored: Settings = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(restored.shortcut, settings.shortcut);
        assert!(!restored.enabled);
    }
}
