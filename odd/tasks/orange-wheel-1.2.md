# Square 1.2 release
Restore Square on the Desktop, record 1.0.0 as the version baseline, then ship an orange glass wheel in 1.2.0.
Branch: feat/orange-wheel-1.2. Delivery: single release. Checks: version consistency, Vite, UI smoke tests, native CI and independent release verification.

## Specs
- S1: "pone el proyecto otra vez en el escritorio de square" — keep the restored checkout on the Desktop.
- S2: "el repo pone bien la version ponele como 1.0" — synchronize package, Rust, Tauri and visible versions at 1.0.0 and retain a source tag.
- S3: "crea una neuva version que sea 1.2 o algo asi" — prepare 1.2.0 and publish Windows portable/installer and Linux AppImage after checks.
- S4: "modificale la rueda y rapida esa que ayuuda a configurar rapido de color naranja y no blanca osea que tenga la misma estetica del programa" — replace the wheel's white surfaces with the application's warm orange/dark glass palette, preserving conversion, keyboard access and pagination.

## Tasks
- T1 [S1,S2] inline — complete: restored, all version metadata and visible UI at 1.0.0; source tag v1.0.0 at 3600787. Risk: item 5 (release metadata).
- T2 [S4] inline — complete: orange/dark glass wheel; build and complete UI regression passed. Risk: none (visual styling).
- T3 [S3] inline + independent verifier — 1.2.0 packages, release links and Desktop portable pending. Risk: item 5 (release).

## Log
- L1: User request: "mira pone el proyecto otra vez en el escritorio de square b.com/xXKuroiKenshiXx/Square luego agarra y el repo pone bien la version ponele como 1.0 y luego agarra y crea una neuva version que sea 1.2 o algo asi y modificale la rueda y rapida esa que ayuuda a configurar rapido de color naranja y no blanca osea que tenga la misma estetica del programa"
- Existing release: 0.2.0; repository restored with clean status. Baseline 1.0.0 will be a source tag, followed by the downloadable 1.2.0 release; this avoids relabelling old binaries.
- Estimated authored delta: under 200 lines. One version unit, one visual unit and one release unit; no parallel writers required.
- Engram and the native gentle-ai executable are unavailable. Memory mirror and native review status are unavailable; no approval is claimed. Independent functional/release verification remains required.
- Oval 0.5.3 was independently confirmed published with 12 assets and every release job successful.

- T1 checks: UI regression first failed on stale v0.2; metadata/build and complete UI smoke test then passed at 1.0.0. Baseline normalization complete; rollback is the version metadata/UI import and its tests.

- T2: the palette regression failed on the white wheel, then passed after the orange-glass change. Conversion, keyboard dismissal, settings, pagination and single-format input remain covered. Captures visually inspected. UI version is read directly from package metadata.

- Independent verification at a345bbc passed S1, S2 and S4; S3 remains pending native packages. Scratch: square-verify-BxqsBv in system temp. Native conversion backend unchanged. Engine provenance helper verified against real FFmpeg/Pandoc binaries; manifests travel with CI artifacts.
