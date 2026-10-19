# Verificación de Square 0.1.0

Proyecto: `C:\Users\kuro\Desktop\Square`.
Repositorio privado: https://github.com/xXKuroiKenshiXx/Square

## Comprobaciones
- TypeScript y Vite: compilación correcta.
- Rust Windows: cinco pruebas correctas.
- Rust Linux Ubuntu 24.04: cinco pruebas correctas con FFmpeg actualizado.
- Pruebas: mapa de formatos; resultados repetidos sin sobrescribir; imagen grande a ICO; rasterización SVG; WAV a MP3 y Markdown a DOCX a TXT con espacios y caracteres Unicode en el nombre.
- Ejecutable Windows final en Escritorio: inicio nativo verificado; proceso responde.
- AppImage final: compilación correcta y proceso activo durante la comprobación de arranque de 20 segundos con Xvfb. Esta prueba no reemplaza una revisión gráfica en cada distribución.
- Vista previa de 640 × 640 inspeccionada: `release-preview.png`.

## Artefactos
- Portable del usuario: `C:\Users\kuro\Desktop\Square-Portable.exe`.
- Instalador NSIS: `src-tauri/target/release/bundle/nsis/Square_0.1.0_x64-setup.exe`.
- AppImage: `release/Square_0.1.0_amd64.AppImage`.
- CI para Windows y Ubuntu 22.04: https://github.com/xXKuroiKenshiXx/Square/actions

La compilación AppImage local tiene base Ubuntu 24.04. La versión de CI tiene base Ubuntu 22.04. No se comprobó ejecución en todas las distribuciones. El portable Windows necesita WebView2; NSIS puede descargarlo si falta. No hay firma digital.

## Alcance
Versión inicial funcional, con el mapa definido en `.specify/spec.md`. PDF ofrece extracción textual a TXT, sin OCR. XLSX y PDF a Word con conservación de diseño siguen pendientes. Las imágenes animadas producen una imagen fija; SVG solo se rasteriza. Audio a video requiere definir un lienzo y no se ofrece en esta versión. HEIC depende del decoder disponible. Estas restricciones se documentan para no presentar rutas de conversión que todavía no estén implementadas como funciones terminadas.

## Tamaños y estado de CI
Portable Windows: 380,85 MiB. NSIS: 67,63 MiB. AppImage: 171,11 MiB.
Los trabajos de GitHub Actions de Windows y Ubuntu 22.04 seguían en ejecución al cerrar esta entrega; las pruebas y artefactos anteriores fueron verificados localmente.

## Actualización visual: naranja pálido y cristal
- Paneles translúcidos, reflejos, bordes iluminados, naranja pálido y negro cálido.
- Desplegable de origen con categorías y selector nativo filtrado; selección general y drag/drop conservados.
- El nombre y la ruta del archivo no aparecen en la vista principal ni en los mensajes de conversión.
- Prueba de interfaz correcta con IPC simulado: selección JPG/JPEG filtrada, destino WEBP, cancelación sin perder el archivo, Escape, clic exterior y resultado sin nombre de archivo.
- Capturas de los dos menús y estados vacío/cargado en `release/ui-*.png`; vista principal en `release-preview.png`.
- Compilación TypeScript/Vite correcta; arranque del portable Windows actualizado verificado. AppImage actualizado activo durante la comprobación de 20 segundos con Xvfb. Instalador y portable del Escritorio reemplazados y hashes regenerados en release/SHA256SUMS.txt.
