# Square 1.2.0 verification

Square 1.2.0 is published with the orange glass wheel, Windows portable and installer, and Linux AppImage. The 1.0.0 tag records the synchronized source baseline only.

## Observed checks

- Version consistency, TypeScript/Vite build and complete UI smoke tests passed.
- Independent verification passed the palette, keyboard access, version and release checks.
- Native [build 39249916038](https://github.com/xXKuroiKenshiXx/Square/actions/runs/39249916038) passed for Windows and Ubuntu 22.04 at tag commit `4637d93fd73279e250681e30d23a6b4e46f25d8c`.
- [Publisher 39251467625](https://github.com/xXKuroiKenshiXx/Square/actions/runs/39251467625) verified all ten uploaded asset digests before publishing.
- Desktop Windows portable and installer report version 1.2.0. The portable reached InputIdle and remained responsive during startup verification.
- A separate Linux 1.2.0 runtime smoke test was not performed; Linux packaging passed CI.

## Download and evidence

[Square 1.2.0 release](https://github.com/xXKuroiKenshiXx/Square/releases/tag/v1.2.0) contains the packages, SHA256SUMS.txt, per-platform engine manifests, SOURCES.md and corresponding engine source archives.

UI smoke tests use simulated IPC. They do not prove selection retrieval in every file manager. Historical promotional media below describes 0.2.0.

---
# Verificación de Square 0.2.0

## Verificado localmente
- TypeScript y Vite: compilación correcta.
- Windows: ocho pruebas Rust correctas; conversiones reales, nombres sin sobrescribir, SVG, ICO, preferencias, validación del atajo y rechazo de ventana inválida.
- Linux: siete pruebas Rust correctas, con conversiones reales y preferencias.
- Arranque Linux: AppImage final permaneció activo durante 20 segundos bajo Xvfb/DBus en Ubuntu 24.04.
- Arranque Windows: ejecutable 0.2 iniciado, responde y alcanza InputIdle.
- Interfaz: ambos menús, cancelación, ocultación del nombre, captura y guardado de combinación, rueda, Escape y paginación.
- Demo: dos conversiones ejecutadas por el motor Rust, con hashes en `docs/demo-manifest.json`.
- Video: H.264/AAC, 1600 × 900, aproximadamente 35 segundos; preview WebP animada.

La prueba de interfaz usa IPC simulado. La lectura de una selección real en Explorer depende del estado del escritorio; no se presenta esa prueba simulada como una verificación completa de todos los exploradores o escritorios. La integración Windows usa las interfaces Shell/COM nativas y lee únicamente la selección al invocar el atajo.

## Paquetes
Las releases incluyen portable e instalador NSIS de Windows y AppImage Linux. La release local de Linux usa Ubuntu 24.04; CI usa Ubuntu 22.04. No se garantiza cualquier distribución. El portable requiere WebView2 y los ejecutables no están firmados.

El estado de compilaciones automatizadas se consulta en [GitHub Actions](https://github.com/xXKuroiKenshiXx/Square/actions). Los hashes y las versiones de motores acompañan los archivos de cada release.

## Alcance
PDF textual → TXT, sin OCR ni PDF → Word fiel al diseño. XLSX sigue pendiente. SVG solo se rasteriza e imágenes animadas producen un cuadro fijo. En Linux, la rueda trabaja con el archivo cargado y los atajos pueden no estar disponibles en Wayland. El cierre de ventana mantiene la app en bandeja cuando esa integración está disponible.
