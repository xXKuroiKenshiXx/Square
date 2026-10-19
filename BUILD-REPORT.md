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
