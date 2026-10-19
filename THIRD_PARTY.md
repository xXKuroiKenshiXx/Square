# Componentes

- FFmpeg: https://ffmpeg.org/ — compilación local `ffmpeg -version`; origen del build: https://github.com/yt-dlp/FFmpeg-Builds . Esta compilación incluye GPL; las fuentes y configuración exactas deben acompañar cualquier redistribución pública.
- Pandoc: https://pandoc.org/ — GPL, fuentes: https://github.com/jgm/pandoc . Versión del motor mediante `pandoc --version`.
- Tauri: MIT/Apache-2.0, https://github.com/tauri-apps/tauri .
- React: MIT, https://github.com/facebook/react .
- image: MIT/Apache-2.0, https://github.com/image-rs/image .
- pdf-extract: MIT, https://github.com/jrmuizel/pdf-extract .
- resvg: MPL-2.0, https://github.com/linebender/resvg .

Los motores compilados no se incluyen en Git. La release 0.2.0 adjunta las fuentes exactas y recetas de los motores; revisiones y enlaces en [docs/ENGINE-SOURCES.md](docs/ENGINE-SOURCES.md). Sus hashes se registran junto a cada descarga.

- tauri-plugin-global-shortcut y tauri-plugin-single-instance: MIT/Apache-2.0, https://github.com/tauri-apps/plugins-workspace .
- windows-rs: MIT/Apache-2.0, https://github.com/microsoft/windows-rs .
- Los recursos gráficos y la música sintetizada de la demo fueron creados para Square. El video muestra las vistas de React; el adaptador ejecuta conversiones locales con el mismo motor Rust. Véase [docs/MEDIA.md](docs/MEDIA.md).
