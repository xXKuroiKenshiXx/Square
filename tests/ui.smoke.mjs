import { chromium, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const appVersion = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).version;

// UI integration test: dialogs and native commands are mocked; conversions are covered by Rust.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 640, height: 640 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.testCalls = [];
    window.cancelNext = false;
    window.demoSettings = {
      shortcut: "Shift+Space",
      enabled: true,
      registered: true,
      error: null,
      platform: "windows",
    };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
    window.__TAURI_INTERNALS__ = {
      metadata: {
        currentWindow: { label: "main" },
        currentWebview: { label: "main" },
      },
      transformCallback: () => 1,
      unregisterCallback() {},
      invoke: async (command, args) => {
        window.testCalls.push({ command, args });
        if (command === "get_settings") return window.demoSettings;
        if (command === "save_settings") {
          window.demoSettings = {
            ...window.demoSettings,
            ...args.settings,
            registered: args.settings.enabled,
          };
          return window.demoSettings;
        }
        if (command === "wheel_context")
          return {
            path: "C:\\fixtures\\sample.svg",
            name: "nombre-privado-del-archivo.svg",
            ext: "svg",
            bytes: 1024,
            targets:
              new URLSearchParams(location.search).get("demo") === "video"
                ? [
                    "mkv",
                    "mov",
                    "webm",
                    "avi",
                    "mpeg",
                    "m4v",
                    "wmv",
                    "ts",
                    "flv",
                    "mp3",
                    "wav",
                    "aac",
                    "flac",
                    "ogg",
                    "wma",
                    "m4a",
                    "opus",
                    "aiff",
                  ]
                : new URLSearchParams(location.search).get("demo") === "single"
                  ? ["txt"]
                  : ["png", "jpg", "webp", "bmp", "tiff", "gif", "ico"],
          };
        if (command === "plugin:dialog|open") {
          if (window.cancelNext) {
            window.cancelNext = false;
            return null;
          }
          return "C:\\fixtures\\nombre-privado-del-archivo.jpg";
        }
        if (command === "inspect")
          return {
            path: args.path,
            name: "nombre-privado-del-archivo.jpg",
            ext: "jpg",
            bytes: 1048576,
            targets: ["png", "webp", "bmp", "tiff", "gif", "ico"],
          };
        if (command === "convert")
          return "C:\\fixtures\\nombre-privado-del-archivo-square.png";
        return 1;
      },
    };
  });
  await page.goto(process.env.SQUARE_URL || "http://127.0.0.1:1420");
  await expect(page.getByText(`v${appVersion}`, { exact: true })).toBeVisible();
  await mkdir("release", { recursive: true });
  await page.screenshot({ path: "release/ui-empty.png" });
  const input = page.getByRole("button", { name: /ORIGEN/ });
  await input.click();
  await expect(
    page.getByRole("dialog", { name: "Formato de entrada" }),
  ).toBeVisible();
  await page.screenshot({ path: "release/ui-input-menu.png" });
  await page.getByRole("button", { name: "JPG", exact: true }).click();
  await expect(page.getByText("Archivo JPG listo")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        window.testCalls.find((x) => x.command === "plugin:dialog|open").args
          .options.filters,
    ),
  ).toEqual([{ name: "JPG", extensions: ["jpg", "jpeg"] }]);
  await expect(page.getByText(/nombre-privado-del-archivo/)).toHaveCount(0);
  expect(await page.locator("[title]").allTextContents()).toEqual([]);
  await page.getByRole("button", { name: /DESTINO/ }).click();
  await page.getByRole("button", { name: "WEBP", exact: true }).click();
  await expect(page.getByRole("button", { name: /DESTINO/ })).toContainText(
    "WEBP",
  );
  await input.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(input).toBeFocused();
  await input.click();
  await page.getByRole("heading").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => {
    window.cancelNext = true;
  });
  await input.click();
  await page.getByRole("button", { name: "MP4", exact: true }).click();
  await expect(input).toContainText("JPG");
  await page.getByRole("button", { name: /Convertir archivo/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "Guardado junto al archivo original",
  );
  await expect(page.getByText(/nombre-privado-del-archivo/)).toHaveCount(0);
  expect(
    await page.evaluate(
      () => window.testCalls.find((x) => x.command === "convert").args.target,
    ),
  ).toBe("webp");
  await page.screenshot({ path: "release/ui-loaded.png" });
  await page.getByRole("button", { name: /DESTINO/ }).click();
  await page.screenshot({ path: "release/ui-output-menu.png" });
  const panel = await page.locator("#output-formats").boundingBox();
  expect(panel.y + panel.height).toBeLessThanOrEqual(640);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  const settingsDialog = page.getByRole("dialog", {
    name: "Configuración",
    exact: true,
  });
  await expect(settingsDialog).toBeVisible();
  await expect(page.locator("#shortcut-record")).toContainText(
    "Shift + Espacio",
  );
  await page.locator("#shortcut-record").click();
  await page.keyboard.press("Control+Shift+k");
  await expect(page.locator("#shortcut-record")).toContainText(
    "Ctrl + Shift + K",
  );
  await page.screenshot({ path: "release/ui-settings.png" });
  const settingsBounds = await settingsDialog.boundingBox();
  expect(settingsBounds.y).toBeGreaterThanOrEqual(0);
  expect(settingsBounds.y + settingsBounds.height).toBeLessThanOrEqual(640);
  await page.getByRole("button", { name: /Guardar configuración/ }).click();
  await expect(settingsDialog).toHaveCount(0);
  expect(await page.evaluate(() => window.demoSettings.shortcut)).toBe(
    "Ctrl+Shift+K",
  );
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await expect(page.locator("#shortcut-record")).toContainText(
    "Ctrl + Shift + K",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Abrir rueda de formatos", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      window.testCalls.some((call) => call.command === "open_wheel"),
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 420, height: 420 });
  await page.goto(
    (process.env.SQUARE_URL || "http://127.0.0.1:1420") + "/?view=wheel",
  );
  await expect(page.getByRole("button", { name: /Convertir a/ })).toHaveCount(
    7,
  );
  // The quick wheel must use orange glass rather than the old white surface.
  const wheelPalette = await page.locator(".wheel-base").evaluate((element) => ({
    fill: getComputedStyle(element).fill,
    text: getComputedStyle(document.querySelector(".wheel-segment text")).fill,
    core: getComputedStyle(document.querySelector(".wheel-core")).fill,
  }));
  const channels = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
  const [red, green, blue] = channels(wheelPalette.fill);
  expect(red).toBeGreaterThan(green + 10);
  expect(green).toBeGreaterThan(blue);
  expect(red).toBeLessThan(180);
  expect(channels(wheelPalette.text)[0]).toBeGreaterThan(200);
  expect(channels(wheelPalette.core)[0]).toBeLessThan(160);
  await page
    .getByRole("button", { name: "Convertir a WEBP", exact: true })
    .hover();
  await page.screenshot({ path: "release/ui-wheel.png" });
  await expect(page.getByText(/nombre-privado-del-archivo/)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Convertir a WEBP", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Listo. Junto al original.",
  );
  expect(
    await page.evaluate(
      () =>
        window.testCalls.find((call) => call.command === "convert").args.target,
    ),
  ).toBe("webp");
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(() =>
      window.testCalls.some((call) => call.command === "dismiss_wheel"),
    ),
  ).toBe(true);
  await page.goto(
    (process.env.SQUARE_URL || "http://127.0.0.1:1420") +
      "/?view=wheel&demo=video",
  );
  await expect(page.getByRole("button", { name: /Convertir a/ })).toHaveCount(
    8,
  );
  await page.getByRole("button", { name: "Más formatos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Convertir a MP3", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Más formatos", exact: true }).click();
  await expect(page.getByRole("button", { name: /Convertir a/ })).toHaveCount(
    2,
  );
  await page.goto(
    (process.env.SQUARE_URL || "http://127.0.0.1:1420") +
      "/?view=wheel&demo=single",
  );
  await expect(page.getByRole("button", { name: /Convertir a/ })).toHaveCount(
    1,
  );
  await page.locator(".wheel-segment text").click();
  await expect(page.getByRole("status")).toContainText(
    "Listo. Junto al original.",
  );
  expect(
    await page.evaluate(
      () =>
        window.testCalls.find((call) => call.command === "convert").args.target,
    ),
  ).toBe("txt");
  expect(errors).toEqual([]);
  console.log(
    "PASS: input/output menus, hidden filename, settings and shortcut capture, wheel conversion, Escape and format pagination.",
  );
} finally {
  await browser.close();
}
