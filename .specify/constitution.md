# Constitución de Square

1. Ventana cuadrada de 640 × 640 píxeles lógicos, bordes suaves, naranja pálido, negro cálido y cristal translúcido con reflejos. Dos bloques cuadrados con desplegables representan origen y destino. La vista principal oculta nombres y rutas de archivos.
2. Privacidad local: ningún archivo se envía a servicios. React presenta estado; Rust valida rutas y ejecuta los motores sin intérprete de comandos.
3. Portabilidad: Windows entrega un ejecutable con motores embebidos. Se extraen a una carpeta temporal versionada. WebView2 es una dependencia del sistema; no se promete un ejecutable independiente del runtime. Linux entrega AppImage compilada en Linux.
4. Integridad: nunca sobrescribir originales o resultados existentes. Convertir primero en temporal del mismo directorio y reservar el nombre de destino de forma exclusiva. Limpiar resultados fallidos.
5. Compatibilidad honesta: no prometer conversión universal sin pérdidas. Solo ofrecer rutas implementadas. Los códecs disponibles dependen del FFmpeg incluido; HEIC requiere decodificador disponible; SVG usa resvg. PDF escaneado requiere OCR, no incluido. XLSX y PDF a DOCX no están implementados.
6. Rendimiento: conversiones en tareas bloqueantes de Rust, UI siempre receptiva, una conversión simultánea por ventana.
7. Distribución: incluir licencias y atribuciones de motores; compilar y verificar cada plataforma antes de declarar un artefacto disponible.
