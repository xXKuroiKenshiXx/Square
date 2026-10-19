//! Reads only the selected local file in the foreground Explorer/Desktop window.
//! Runs on a dedicated COM apartment after an explicit user shortcut; does not use the clipboard.
#[cfg(windows)]
pub fn foreground() -> isize {
    unsafe { windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow().0 as isize }
}
#[cfg(not(windows))]
pub fn foreground() -> isize {
    0
}

#[cfg(windows)]
pub fn selected_file(handle: isize) -> Result<String, String> {
    std::thread::spawn(move || selected_file_sta(handle))
        .join()
        .map_err(|_| "No se pudo leer la selección del Explorador.".to_string())?
}
#[cfg(windows)]
fn selected_file_sta(handle: isize) -> Result<String, String> {
    use windows::{
        core::Interface,
        Win32::{
            Foundation::HWND,
            System::{
                Com::{
                    CoCreateInstance, CoInitializeEx, CoUninitialize, IServiceProvider, CLSCTX_ALL,
                    COINIT_APARTMENTTHREADED,
                },
                Variant::VARIANT,
            },
            UI::{
                Shell::{
                    IFolderView2, IShellBrowser, IShellWindows, IWebBrowserApp,
                    SID_STopLevelBrowser, ShellWindows, SIGDN_FILESYSPATH, SWC_DESKTOP,
                    SWFO_NEEDDISPATCH,
                },
                WindowsAndMessaging::GetClassNameW,
            },
        },
    };
    unsafe {
        CoInitializeEx(None, COINIT_APARTMENTTHREADED)
            .ok()
            .map_err(|e| e.to_string())?;
        struct Apartment;
        impl Drop for Apartment {
            fn drop(&mut self) {
                unsafe {
                    CoUninitialize();
                }
            }
        }
        let _apartment = Apartment;
        let mut class = [0u16; 128];
        let len = GetClassNameW(HWND(handle as *mut _), &mut class);
        let class = String::from_utf16_lossy(&class[..len.max(0) as usize]);
        if !["CabinetWClass", "ExploreWClass", "Progman", "WorkerW"].contains(&class.as_str()) {
            return Err(
                "Seleccioná un archivo en el Explorador o en el Escritorio y usá el atajo.".into(),
            );
        }
        let result = (|| -> windows::core::Result<String> {
            let windows: IShellWindows = CoCreateInstance(&ShellWindows, None, CLSCTX_ALL)?;
            let dispatch = if class == "Progman" || class == "WorkerW" {
                let mut desktop_handle = 0;
                windows.FindWindowSW(
                    &VARIANT::default(),
                    &VARIANT::default(),
                    SWC_DESKTOP,
                    &mut desktop_handle,
                    SWFO_NEEDDISPATCH,
                )?
            } else {
                let mut active = None;
                for index in 0..windows.Count()? {
                    if let Ok(window) = windows.Item(&VARIANT::from(index)) {
                        if let Ok(browser) = window.cast::<IWebBrowserApp>() {
                            if browser.HWND()?.0 == handle {
                                active = Some(window);
                                break;
                            }
                        }
                    }
                }
                active.ok_or_else(|| {
                    windows::core::Error::from_hresult(windows::core::HRESULT(0x80004005u32 as i32))
                })?
            };
            let provider: IServiceProvider = dispatch.cast()?;
            let browser: IShellBrowser = provider.QueryService(&SID_STopLevelBrowser)?;
            let view: IFolderView2 = browser.QueryActiveShellView()?.cast()?;
            let items = view.GetSelection(false)?;
            if items.GetCount()? != 1 {
                return Ok(String::new());
            }
            let item = items.GetItemAt(0)?;
            let path = item.GetDisplayName(SIGDN_FILESYSPATH)?;
            let text = path.to_string();
            windows::Win32::System::Com::CoTaskMemFree(Some(path.0.cast()));
            Ok(text?)
        })();
        let path = result.map_err(|_| {
            "No se pudo leer la selección. Seleccioná un archivo local en el Explorador."
                .to_string()
        })?;
        if path.is_empty() {
            return Err("Seleccioná un solo archivo para abrir la rueda.".into());
        }
        if !std::path::Path::new(&path).is_file() {
            return Err("Elegí un archivo local; las carpetas y los archivos solo en la nube no se convierten.".into());
        }
        Ok(path)
    }
}

#[cfg(all(test, windows))]
mod tests {
    #[test]
    fn unknown_window_is_rejected_without_reading_files() {
        assert!(super::selected_file(0).is_err());
    }
}
