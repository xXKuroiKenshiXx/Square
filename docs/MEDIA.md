# Video y recursos de presentación

`demo.mp4` es un video promocional de 35 segundos, 1600 × 900, H.264/AAC. `demo.webp` es su vista previa animada para el README. `cover.png`, `social-preview.png` y `settings.png` son capturas del mismo escenario.

Se graban las vistas reales de React en Chromium, con un escenario gráfico propio. Los diálogos de archivos y el transporte de la ventana se preparan mediante un adaptador de grabación; **no es una captura nativa del Explorador de Windows ni una medida de rendimiento**.

Las conversiones SVG → WEBP y SVG → PNG se ejecutan de verdad con `convert_sync`, la misma función de Rust que usa la app. Sus tamaños y hashes están en `demo-manifest.json`. Los archivos de muestra y el acompañamiento musical sintetizado son originales de Square; no se incluyen archivos del usuario ni material de Tangerine u Oval.

## Reproducir la grabación

```bash
npm ci
npx playwright install chromium
npm run build
cargo build --manifest-path src-tauri/Cargo.toml --example demo_convert
node scripts/record-demo.mjs
```

Requiere los motores preparados y FFmpeg en PATH. Los archivos temporales quedan en `release/demo-recording/`, que está excluido de Git. La grabación abre un servidor de demostración exclusivamente en `127.0.0.1`; no agrega un servidor a la aplicación distribuida.

Las capturas app.png y wheel.png muestran Square 1.2.0 y su rueda naranja. El video y la vista animada se conservan como demostración histórica de 0.2; su rueda clara no representa el diseño actual.

