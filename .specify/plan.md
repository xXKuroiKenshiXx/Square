# /plan

React + TypeScript + Vite + Tailwind 4. Ventana Tauri 2 sin decoraciones; controles accesibles y eventos nativos de drag/drop. React invoca inspect y convert; backend vuelve a validar el destino, sin confiar en el frontend.

Rust usa image para raster, pdf-extract para PDF textual, FFmpeg para medios y Pandoc sandbox para documentos. Ejecutables embebidos con include_bytes y extraídos de forma atómica antes del primer uso. No usar shell para argumentos de archivos. spawn_blocking evita bloquear la UI. Temporales junto al original permiten detectar permisos de escritura antes de convertir.

Distribuir Square.exe + NSIS en Windows; AppImage en Ubuntu 22.04. CI prepara motores por plataforma y guarda artefactos. No usar updater ni telemetría. Versiones resueltas por package-lock.json y Cargo.lock. Los binarios de motores no se versionan en Git; script de preparación los obtiene o copia.

Validación: TypeScript/Vite, pruebas Rust del mapa y colisiones, conversiones reales imagen/audio/documento, lanzamiento del portable y compilación NSIS. La validación AppImage corresponde al job Linux.

Versión 0.2: ventana radial transparente independiente, estado compartido y exclusión mutua de conversiones. Atajo global configurable y preferencias atómicas; Shell/COM lee la selección activa en Windows. Bandeja e instancia única mantienen accesible la aplicación. Linux reutiliza el último archivo cargado.
