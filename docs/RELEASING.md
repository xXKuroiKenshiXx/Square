# Preparar una release

1. Actualizá las versiones de `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `Cargo.lock` y `tauri.conf.json`; anotá los cambios en `CHANGELOG.md`.
2. Ejecutá las pruebas de Rust, la compilación web y las pruebas de interfaz. Comprobá arranque y funcionamiento nativo en cada plataforma que declares compatible. No confundas el IPC simulado de la prueba de UI con la integración real del sistema.
3. Prepará los motores y guardá versiones, hashes, fuentes exactas, parches, recetas y referencias de las bibliotecas enlazadas. Actualizá `ENGINE-SOURCES.md` y `engine-manifest.json`. No uses una URL `latest` para identificar una release archivada.
4. Generá NSIS y portable en Windows y AppImage en Linux. Identificá la distribución base del AppImage y si los binarios están firmados.
5. Si cambió la UI, regenerá los medios con `scripts/record-demo.mjs`; revisá comienzo, centro y final del video. Los archivos de muestra deben ser propios y no contener datos del usuario.
6. Ejecutá `node scripts/check-publication.mjs`, revisá el contenido que se va a subir y confirmá que `release/`, motores y registros locales están excluidos de Git.
7. Creá una etiqueta y una release en borrador. Adjuntá los binarios, fuentes de motores y un `SHA256SUMS.txt` de los archivos distribuidos. Comprobá que las descargas del README coinciden con los nombres reales.
8. Publicá como preliminar mientras existan las limitaciones de 0.2. No presentes soporte de formatos u otras plataformas que todavía no se haya implementado.

La revisión por patrones detecta errores comunes, no reemplaza una auditoría de seguridad ni una revisión de licencias. El CI proporciona artefactos para pruebas; el mantenedor selecciona y verifica qué binarios publica como release.
