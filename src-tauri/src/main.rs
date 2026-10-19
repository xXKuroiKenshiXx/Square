#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};
const AUDIO: &[&str] = &[
    "mp3", "wav", "aac", "flac", "ogg", "wma", "m4a", "opus", "aiff",
];
const VIDEO: &[&str] = &[
    "mp4", "mkv", "mov", "webm", "avi", "mpeg", "m4v", "wmv", "ts", "flv",
];
const IMAGES: &[&str] = &[
    "png", "jpg", "jpeg", "webp", "bmp", "tiff", "tif", "gif", "ico", "avif", "pnm", "tga", "dds",
    "qoi", "heic", "heif",
];
const DOCS: &[&str] = &[
    "docx", "md", "markdown", "html", "htm", "txt", "rst", "odt", "rtf", "epub", "latex", "tex",
];
fn targets(ext: &str) -> Vec<String> {
    let options: Vec<&str> = if VIDEO.contains(&ext) {
        VIDEO.iter().chain(AUDIO).copied().collect()
    } else if AUDIO.contains(&ext) {
        AUDIO.to_vec()
    } else if IMAGES.contains(&ext) || ext == "svg" {
        vec!["png", "jpg", "webp", "bmp", "tiff", "gif", "ico"]
    } else if ext == "pdf" {
        vec!["txt"]
    } else if DOCS.contains(&ext) {
        vec!["docx", "md", "html", "txt", "odt", "rtf", "epub"]
    } else {
        vec![]
    };
    options
        .into_iter()
        .filter(|x| *x != ext)
        .map(str::to_owned)
        .collect()
}
#[derive(Serialize)]
struct Info {
    path: String,
    name: String,
    ext: String,
    bytes: u64,
    targets: Vec<String>,
}
fn source(path: &str) -> Result<PathBuf, String> {
    let p = fs::canonicalize(path).map_err(|e| format!("Archivo inaccesible: {e}"))?;
    if !p.is_file() {
        return Err("Seleccioná un archivo regular.".into());
    }
    Ok(p)
}
fn extension(p: &Path) -> String {
    p.extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_lowercase()
}
#[tauri::command]
fn inspect(path: String) -> Result<Info, String> {
    let p = source(&path)?;
    let ext = extension(&p);
    Ok(Info {
        path: p.to_string_lossy().into(),
        name: p.file_name().unwrap_or_default().to_string_lossy().into(),
        bytes: p.metadata().map_err(|e| e.to_string())?.len(),
        targets: targets(&ext),
        ext,
    })
}
fn engine(name: &str) -> Result<PathBuf, String> {
    let bytes: &[u8] = match name {
        "ffmpeg" => include_bytes!("../engines/ffmpeg.bin"),
        "pandoc" => include_bytes!("../engines/pandoc.bin"),
        _ => return Err("Motor desconocido".into()),
    };
    if bytes.is_empty() {
        return Err(format!(
            "El motor {name} no fue incluido en esta compilación."
        ));
    }
    static ENGINE_DIR: std::sync::OnceLock<tempfile::TempDir> = std::sync::OnceLock::new();
    if ENGINE_DIR.get().is_none() {
        let fresh = tempfile::Builder::new()
            .prefix("Square-engines-")
            .tempdir()
            .map_err(|e| e.to_string())?;
        let _ = ENGINE_DIR.set(fresh);
    }
    let dir = ENGINE_DIR
        .get()
        .ok_or("No se pudo preparar el motor")?
        .path();
    let p = dir.join(if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.to_owned()
    });
    if !p.exists() || p.metadata().map_err(|e| e.to_string())?.len() != bytes.len() as u64 {
        let mut f = tempfile::NamedTempFile::new_in(&dir).map_err(|e| e.to_string())?;
        use std::io::Write;
        f.write_all(bytes).map_err(|e| e.to_string())?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            f.as_file()
                .set_permissions(fs::Permissions::from_mode(0o700))
                .map_err(|e| e.to_string())?;
        }
        f.persist(&p).map_err(|e| e.to_string())?;
    }
    Ok(p)
}
fn run(name: &str, args: &[String]) -> Result<(), String> {
    let mut cmd = Command::new(engine(name)?);
    cmd.args(args);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    let output = cmd.output().map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(())
    } else {
        let msg = String::from_utf8_lossy(&output.stderr);
        Err(format!(
            "{name}: {}",
            msg.chars()
                .rev()
                .take(1800)
                .collect::<String>()
                .chars()
                .rev()
                .collect::<String>()
        ))
    }
}
fn convert_sync(path: String, target: String) -> Result<String, String> {
    let p = source(&path)?;
    let ext = extension(&p);
    if !targets(&ext).contains(&target) {
        return Err("Conversión no compatible.".into());
    }
    let parent = p.parent().ok_or("Directorio inválido")?;
    let staging = tempfile::Builder::new()
        .prefix(".square-")
        .tempdir_in(parent)
        .map_err(|e| format!("No se puede escribir junto al original: {e}"))?;
    let out = staging.path().join(format!("result.{target}"));
    let input = p.to_string_lossy().to_string();
    let output = out.to_string_lossy().to_string();
    if VIDEO.contains(&ext.as_str()) || AUDIO.contains(&ext.as_str()) {
        let mut args = vec![
            "-nostdin".into(),
            "-hide_banner".into(),
            "-loglevel".into(),
            "error".into(),
            "-n".into(),
            "-i".into(),
            input,
        ];
        if AUDIO.contains(&target.as_str()) {
            args.extend(["-vn".into()]);
        }
        match target.as_str() {
            "mp4" | "mov" | "mkv" => args.extend([
                "-c:v".into(),
                "libx264".into(),
                "-preset".into(),
                "fast".into(),
                "-pix_fmt".into(),
                "yuv420p".into(),
                "-c:a".into(),
                "aac".into(),
            ]),
            "webm" => args.extend([
                "-c:v".into(),
                "libvpx-vp9".into(),
                "-c:a".into(),
                "libopus".into(),
            ]),
            _ => (),
        };
        args.push(output);
        run("ffmpeg", &args)?;
    } else if IMAGES.contains(&ext.as_str()) || ext == "svg" {
        if ["heic", "heif"].contains(&ext.as_str()) {
            run(
                "ffmpeg",
                &[
                    "-nostdin".into(),
                    "-hide_banner".into(),
                    "-loglevel".into(),
                    "error".into(),
                    "-n".into(),
                    "-i".into(),
                    input,
                    "-frames:v".into(),
                    "1".into(),
                    output,
                ],
            )?;
        } else {
            let img = if ext == "svg" {
                let bytes = fs::read(&p).map_err(|e| e.to_string())?;
                let tree = resvg::usvg::Tree::from_data(&bytes, &resvg::usvg::Options::default())
                    .map_err(|e| e.to_string())?;
                let size = tree.size().to_int_size();
                if u64::from(size.width()) * u64::from(size.height()) > 100_000_000 {
                    return Err("SVG demasiado grande para rasterizar.".into());
                }
                let mut pixmap = resvg::tiny_skia::Pixmap::new(size.width(), size.height())
                    .ok_or("Tamaño SVG inválido")?;
                resvg::render(
                    &tree,
                    resvg::tiny_skia::Transform::default(),
                    &mut pixmap.as_mut(),
                );
                let png = pixmap.encode_png().map_err(|e| e.to_string())?;
                image::load_from_memory(&png).map_err(|e| e.to_string())?
            } else {
                image::ImageReader::open(&p)
                    .map_err(|e| e.to_string())?
                    .with_guessed_format()
                    .map_err(|e| e.to_string())?
                    .decode()
                    .map_err(|e| e.to_string())?
            };
            if target == "jpg" {
                img.to_rgb8().save(&out).map_err(|e| e.to_string())?
            } else {
                img.save(&out).map_err(|e| e.to_string())?
            }
        }
    } else if ext == "pdf" {
        let text =
            pdf_extract::extract_text(&p).map_err(|e| format!("No se pudo extraer texto: {e}"))?;
        if text.trim().is_empty() {
            return Err(
                "El PDF no contiene texto extraíble. Los documentos escaneados requieren OCR."
                    .into(),
            );
        }
        fs::write(&out, text).map_err(|e| e.to_string())?;
    } else {
        let from = match ext.as_str() {
            "txt" => "markdown",
            "md" | "markdown" => "markdown",
            "htm" => "html",
            "tex" => "latex",
            x => x,
        };
        let to = match target.as_str() {
            "txt" => "plain",
            "md" => "markdown",
            x => x,
        };
        run(
            "pandoc",
            &[
                "--sandbox".into(),
                "-f".into(),
                from.into(),
                "-t".into(),
                to.into(),
                input,
                "-o".into(),
                output,
            ],
        )?;
    }
    if out.metadata().map_err(|e| e.to_string())?.len() == 0 {
        return Err("El motor produjo un archivo vacío.".into());
    }
    let stem = p.file_stem().unwrap_or_default().to_string_lossy();
    for i in 1..10000 {
        let name = if i == 1 {
            format!("{stem}-square.{target}")
        } else {
            format!("{stem}-square-{i}.{target}")
        };
        let dest = parent.join(name);
        match fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&dest)
        {
            Ok(mut file) => {
                let result = (|| {
                    let mut src = fs::File::open(&out)?;
                    std::io::copy(&mut src, &mut file)?;
                    file.sync_all()
                })();
                if let Err(e) = result {
                    drop(file);
                    let _ = fs::remove_file(&dest);
                    return Err(e.to_string());
                }
                return Ok(dest.to_string_lossy().into());
            }
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e.to_string()),
        }
    }
    Err("Demasiados archivos con el mismo nombre.".into())
}
#[tauri::command]
async fn convert(path: String, target: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || convert_sync(path, target))
        .await
        .map_err(|e| e.to_string())?
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![inspect, convert])
        .run(tauri::generate_context!())
        .expect("No se pudo iniciar Square");
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn matrix() {
        assert!(targets("mp4").contains(&"mp3".into()));
        assert!(!targets("png").contains(&"svg".into()));
        assert_eq!(targets("pdf"), vec!["txt"]);
        assert!(targets("exe").is_empty());
    }
    #[test]
    fn saves_without_overwriting() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("sample.png");
        image::RgbImage::new(2, 2).save(&p).unwrap();
        let first = convert_sync(p.to_string_lossy().into(), "bmp".into()).unwrap();
        let second = convert_sync(p.to_string_lossy().into(), "bmp".into()).unwrap();
        assert_ne!(first, second);
        assert!(p.exists());
        assert_eq!(image::open(first).unwrap().width(), 2);
    }
    #[test]
    fn embedded_engines_and_real_conversions() {
        let dir = tempfile::tempdir().unwrap();
        let md = dir.path().join("prueba con espacios ñ.md");
        fs::write(&md, "# Square\n\nTexto de prueba.").unwrap();
        let doc = convert_sync(md.to_string_lossy().into(), "docx".into()).unwrap();
        assert!(fs::metadata(&doc).unwrap().len() > 100);
        let text = convert_sync(doc, "txt".into()).unwrap();
        assert!(fs::read_to_string(text)
            .unwrap()
            .contains("Texto de prueba"));
        let wav = dir.path().join("tone.wav");
        run(
            "ffmpeg",
            &[
                "-nostdin".into(),
                "-hide_banner".into(),
                "-loglevel".into(),
                "error".into(),
                "-f".into(),
                "lavfi".into(),
                "-i".into(),
                "sine=frequency=440:duration=0.2".into(),
                wav.to_string_lossy().into(),
            ],
        )
        .unwrap();
        let mp3 = convert_sync(wav.to_string_lossy().into(), "mp3".into()).unwrap();
        assert!(fs::metadata(mp3).unwrap().len() > 100);
    }
    #[test]
    fn svg_and_rejected_targets() {
        let dir = tempfile::tempdir().unwrap();
        let svg = dir.path().join("shape.svg");
        fs::write(&svg,r#"<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>"#).unwrap();
        let png = convert_sync(svg.to_string_lossy().into(), "png".into()).unwrap();
        assert_eq!(image::open(png).unwrap().width(), 20);
        assert!(convert_sync(svg.to_string_lossy().into(), "exe".into()).is_err());
    }
}
