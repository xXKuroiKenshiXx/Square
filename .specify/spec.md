# /specify — Square 0.1

## /clarify — Decisiones adoptadas
Plataformas: Windows x64 y Linux x64 mediante AppImage. Proyecto local en el Escritorio. Instalador Windows NSIS por usuario. No se requiere macOS. El portable utiliza el WebView2 instalado en Windows. Los motores se embeben, sin descarga al convertir.

## Historias y aceptación
- Soltar un archivo o seleccionarlo abre su extensión, nombre y tamaño; destino solo presenta el mapa aplicable.
- Elegir destino desde menú flotante y convertir; mostrar estado y ruta final o error comprensible.
- El original permanece intacto y un segundo resultado recibe sufijo numérico.
- Audio: MP3, WAV, AAC, FLAC, OGG, WMA, M4A, OPUS, AIFF. Video: MP4, MKV, MOV, WEBM, AVI, MPEG, M4V, WMV, TS, FLV; extracción de audio permitida.
- Imágenes raster: PNG, JPG, WEBP, BMP, TIFF, GIF, ICO; AVIF y otros como entrada según decoder. GIF animado se reduce a primer cuadro. JPEG descarta transparencia. SVG se rasteriza con resvg; HEIC queda sujeto al decoder FFmpeg de la distribución.
- Documentos: DOCX, MD, HTML, TXT, ODT, RTF, EPUB mediante Pandoc. PDF a TXT mediante extracción nativa sin OCR. TXT se interpreta como Markdown para las conversiones documentales. Recursos externos y macros no se ejecutan.
- Fuera de versión 0.1: XLSX, OCR, PDF con fidelidad de diseño a DOCX, generación de SVG vectorial, lote, cancelación y progreso porcentual. Audio a video necesita definir una imagen o lienzo y queda fuera de esta versión.

## Límites de entrega
AppImage se genera en Ubuntu con WebKitGTK 4.1; no se presenta un ejecutable Windows como artefacto Linux. El repositorio remoto requiere credenciales GitHub válidas.

## Versión 0.2 — rueda rápida
Shift + Espacio abre una rueda junto al cursor. En Windows lee un único archivo seleccionado en Explorer o Escritorio; en Linux usa el archivo cargado. El usuario puede cambiar o desactivar el atajo en Configuración. Solo se ofrecen formatos convertibles y el resultado conserva la carpeta original. Escape y pérdida de foco cierran la rueda. El nombre del archivo permanece oculto en la vista principal.
