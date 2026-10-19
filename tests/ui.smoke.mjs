import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

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
  expect(errors).toEqual([]);
  console.log(
    "PASS: filtered input menu, output menu, hidden filename, cancellation, Escape, outside click and conversion state.",
  );
} finally {
  await browser.close();
}
