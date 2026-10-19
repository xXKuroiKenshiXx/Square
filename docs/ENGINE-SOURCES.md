# Motores incluidos en Square 0.2.0

Los ejecutables de esta release incluyen FFmpeg GPL y Pandoc. Al publicar se adjuntan sus fuentes y las recetas de compilación junto a los binarios de Square; no hay que buscar un `latest` mutable para identificar la versión usada.

| Componente | Windows x64 | Linux x64 |
| --- | --- | --- |
| FFmpeg | `N-125875-g5d4d3bdc61-20260731` | `N-127654-g7045cc9b80-20261018` |
| FFmpeg, revisión completa | `5d4d3bdc61412641883a45e060e810f80ea7f4b5` | `7045cc9b8020ebaae156f4947baa752625056f90` |
| Recetas yt-dlp/FFmpeg-Builds | `a99e8230eae00d1cee38f23076a7a1f55cd984e2` | `bf23782fa09c1ab08a3c13f2f1508d7ef0e620c6` |
| Pandoc | `3.12.1` | `3.12.1` |

## Fuentes de la release

- [FFmpeg Windows: fuente exacta](https://github.com/xXKuroiKenshiXx/Square/releases/download/v0.2.0/ffmpeg-windows-5d4d3bdc61-source.tar.gz)
- [FFmpeg Linux: fuente exacta](https://github.com/xXKuroiKenshiXx/Square/releases/download/v0.2.0/ffmpeg-linux-7045cc9b80-source.tar.gz)
- [Pandoc 3.12.1: fuente](https://github.com/xXKuroiKenshiXx/Square/releases/download/v0.2.0/pandoc-3.12.1-source.tar.gz)
- [Recetas Windows](https://github.com/xXKuroiKenshiXx/Square/releases/download/v0.2.0/ffmpeg-build-recipes-windows.tar.gz) y [recetas Linux](https://github.com/xXKuroiKenshiXx/Square/releases/download/v0.2.0/ffmpeg-build-recipes-linux.tar.gz). Incluyen scripts, parches, licencias y referencias a las fuentes de las bibliotecas enlazadas. Para reconstruir los motores, usá las instrucciones y las fuentes fijadas por esas recetas, no únicamente la fuente de FFmpeg.
- El código de Square está en la etiqueta [v0.2.0](https://github.com/xXKuroiKenshiXx/Square/tree/v0.2.0), con `Cargo.lock` y `package-lock.json`. Sus dependencias se obtienen de los registros indicados en esos archivos.

[Hashes de los archivos fuente](source-checksums.json). La release incluye `SHA256SUMS.txt` para comprobar las descargas y `engine-manifest.json` para identificar los motores embebidos.

La distribución GPL de FFmpeg está habilitada con `--enable-gpl --enable-version3`. FFmpeg y las bibliotecas enlazadas conservan sus avisos. Pandoc conserva su GPL; Square se distribuye bajo GPL-3.0-or-later. No se afirma reproducibilidad binaria bit a bit: las herramientas y los entornos de compilación también influyen.

Los scripts de desarrollo permiten preparar motores de otras versiones. En ese caso, los resultados de una compilación propia o de CI pueden diferir de estos binarios; antes de publicar otra release hay que actualizar esta tabla, los hashes y las fuentes. Referencias: [FFmpeg legal](https://ffmpeg.org/legal.html), [recetas originales](https://github.com/yt-dlp/FFmpeg-Builds), [Pandoc](https://github.com/jgm/pandoc).
