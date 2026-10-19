# Contribuir a Square

Antes de abrir una PR, comentá el cambio en un issue si afecta a la arquitectura o suma un motor. Cambios pequeños y correcciones de errores pueden ir directamente a PR.

1. Instalá los requisitos del README y prepará los motores locales.
2. Trabajá en una rama y limitá la PR a un problema concreto.
3. Ejecutá `npm run build` y `cargo test --manifest-path src-tauri/Cargo.toml --bin square`.
4. Si cambia el flujo de la interfaz, ejecutá `npm run test:ui` con Vite activo. Adjuntá una captura.
5. Explicá el problema, el resultado y cómo lo verificaste.

No agregues conversiones al menú hasta que exista una ruta real en el motor. Nunca sobrescribas originales. No introduzcas cargas a servidores ni telemetría. No incluyas archivos personales, motores compilados, credenciales o registros con rutas privadas.

Para agregar un formato, actualizá el mapeo de Rust, la documentación y una prueba que convierta un archivo válido. Registrá la licencia de cualquier dependencia nueva. Las contribuciones se distribuyen bajo GPL-3.0-or-later.
