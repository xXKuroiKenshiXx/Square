/** Repeatable promo: the shipped React views, fixture dialogs, and the real Rust conversion function. */
import { chromium, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const media = path.join(root, "docs");
const temporary = path.join(root, "release", "demo-recording");
const fixtures = path.join(temporary, "fixtures");
await mkdir(fixtures, { recursive: true });
await mkdir(media, { recursive: true });
const fixture = path.join(fixtures, "studio.svg");
await writeFile(
  fixture,
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" rx="70" fill="#eee6db"/><circle cx="400" cy="300" r="170" fill="#efb78a"/><rect x="320" y="220" width="160" height="160" rx="35" fill="#fff4e6"/></svg>',
);
const adapter =
  process.env.SQUARE_DEMO_ENGINE ||
  path.join(
    root,
    "src-tauri",
    "target",
    "debug",
    "examples",
    process.platform === "win32" ? "demo_convert.exe" : "demo_convert",
  );
const captures = [];
let settings = {
  shortcut: "Shift+Space",
  enabled: true,
  registered: true,
  error: null,
  platform: "windows",
};
const info = {
  path: fixture,
  name: "studio.svg",
  ext: "svg",
  bytes: (await stat(fixture)).size,
  targets: ["png", "jpg", "webp", "bmp", "tiff", "gif", "ico"],
};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    response.setHeader("Cache-Control", "no-store");
    if (url.pathname === "/api/context") {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(info));
      return;
    }
    if (url.pathname === "/api/settings") {
      if (request.method === "POST") {
        let body = "";
        for await (const chunk of request) body += chunk;
        settings = { ...settings, ...JSON.parse(body) };
      }
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(settings));
      return;
    }
    if (url.pathname === "/api/convert" && request.method === "POST") {
      let body = "";
      for await (const chunk of request) body += chunk;
      const { target } = JSON.parse(body);
      if (!info.targets.includes(target))
        throw new Error("Unsupported demo target");
      const result = await run(adapter, [fixture, target], {
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      });
      const output = result.stdout.trim();
      const bytes = await readFile(output);
      captures.push({
        source: "studio.svg",
        target,
        output: path.basename(output),
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ path: output }));
      return;
    }
    let source;
    if (url.pathname === "/")
      source = path.join(root, "scripts", "promo-stage.html");
    else if (url.pathname === "/app" || url.pathname === "/app/")
      source = path.join(root, "dist", "index.html");
    else if (url.pathname.startsWith("/assets/"))
      source = path.join(root, "dist", url.pathname.slice(1));
    else {
      response.writeHead(404);
      response.end();
      return;
    }
    if (!source.startsWith(root + path.sep)) throw new Error("Invalid path");
    const extension = path.extname(source);
    response.setHeader(
      "Content-Type",
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".js"
          ? "text/javascript"
          : extension === ".css"
            ? "text/css"
            : "application/octet-stream",
    );
    response.end(await readFile(source));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: String(error) }));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: { dir: temporary, size: { width: 1600, height: 900 } },
  });
  await context.addInitScript(() => {
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
    window.__TAURI_INTERNALS__ = {
      metadata: {
        currentWindow: { label: "main" },
        currentWebview: { label: "main" },
      },
      transformCallback: () => 1,
      unregisterCallback() {},
      invoke: async (command, args) => {
        if (command === "inspect" || command === "wheel_context")
          return fetch("/api/context").then((r) => r.json());
        if (command === "plugin:dialog|open")
          return (await fetch("/api/context").then((r) => r.json())).path;
        if (command === "convert") {
          const response = await fetch("/api/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          return result.path;
        }
        if (command === "get_settings")
          return fetch("/api/settings").then((r) => r.json());
        if (command === "save_settings")
          return fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args.settings),
          }).then((r) => r.json());
        if (command === "dismiss_wheel")
          parent.postMessage({ type: "dismiss-wheel" }, location.origin);
        return 1;
      },
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  const app = page.frameLocator("#app");
  const wait = (ms) => page.waitForTimeout(ms);
  async function scene(id) {
    await page.evaluate((id) => window.setScene(id), id);
    await wait(700);
  }
  async function pointTo(locator, click = false) {
    const box = await locator.boundingBox();
    if (!box) throw new Error("Missing demo element");
    await page.evaluate(({ x, y }) => window.movePointer(x, y), {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    });
    await wait(550);
    if (click) {
      await page.evaluate(() => window.pulsePointer());
      await locator.click();
      await wait(350);
    } else await locator.hover();
  }
  await expect(app.getByRole("heading", { level: 1 })).toBeVisible();
  await wait(2700);
  await scene(1);
  await pointTo(app.getByRole("button", { name: /ORIGEN/ }), true);
  await wait(900);
  await pointTo(app.getByRole("button", { name: "SVG", exact: true }), true);
  await pointTo(app.getByRole("button", { name: /DESTINO/ }), true);
  await wait(650);
  await pointTo(app.getByRole("button", { name: "WEBP", exact: true }), true);
  await pointTo(app.getByRole("button", { name: /Convertir archivo/ }), true);
  await expect(app.getByRole("status")).toContainText("Listo.", {
    timeout: 30000,
  });
  await wait(1500);
  await scene(2);
  const wheel = page.frameLocator("#wheel");
  await expect(
    wheel.getByRole("button", { name: "Convertir a PNG", exact: true }),
  ).toBeVisible();
  await pointTo(
    wheel.getByRole("button", { name: "Convertir a WEBP", exact: true }),
  );
  await wait(1400);
  await page.screenshot({ path: path.join(media, "cover.png") });
  await pointTo(
    wheel.getByRole("button", { name: "Convertir a PNG", exact: true }),
    true,
  );
  await expect(wheel.getByRole("status")).toContainText("Listo.", {
    timeout: 30000,
  });
  await wait(1200);
  await scene(3);
  await pointTo(
    app.getByRole("button", { name: "Configuración", exact: true }),
    true,
  );
  await wait(850);
  await pointTo(app.locator("#shortcut-record"), true);
  await page.keyboard.press("Control+Shift+k");
  await wait(1000);
  await page.screenshot({ path: path.join(media, "settings.png") });
  await pointTo(
    app.getByRole("button", { name: /Guardar configuración/ }),
    true,
  );
  await wait(1000);
  await scene(4);
  await wait(4200);
  await page.screenshot({ path: path.join(media, "social-preview.png") });
  expect(errors).toEqual([]);
  expect(captures.map((c) => c.target)).toEqual(["webp", "png"]);
  const video = page.video();
  await context.close();
  const raw = await video.path();
  const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
  // Browser video starts before navigation: remove its blank loading frames.
  const probe = await run(ffmpeg, ["-i", raw, "-vf", "signalstats,metadata=print:file=-", "-an", "-f", "null", "-"], { windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  let timestamp = 0;
  let start = 0;
  for (const line of probe.stdout.split(/\r?\n/)) {
    const time = line.match(/pts_time:([\d.]+)/);
    if (time) timestamp = Number(time[1]);
    const luma = line.match(/^lavfi.signalstats.YAVG=([\d.]+)/);
    if (luma && Number(luma[1]) < 180) { start = timestamp + 0.04; break; }
  }
  await run(
    ffmpeg,
    [
      "-y",
      "-ss",
      String(start),
      "-i",
      raw,
      "-f",
      "lavfi",
      "-i",
      "aevalsrc=0.008*(sin(2*PI*130.81*t)+sin(2*PI*164.81*t)+sin(2*PI*196*t)):s=48000",
      "-map",
      "0:v",
      "-map",
      "1:a",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-af",
      "afade=t=in:d=2",
      "-shortest",
      "-movflags",
      "+faststart",
      path.join(media, "demo.mp4"),
    ],
    { windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
  );
  await run(
    ffmpeg,
    [
      "-y",
      "-i",
      path.join(media, "demo.mp4"),
      "-an",
      "-vf",
      "fps=7,scale=960:-2",
      "-c:v",
      "libwebp_anim",
      "-quality",
      "65",
      "-loop",
      "0",
      path.join(media, "demo.webp"),
    ],
    { windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
  );
  await writeFile(
    path.join(media, "demo-manifest.json"),
    JSON.stringify(
      {
        description:
          "React interface recorded in Chromium. Fixture file dialogs; conversions use the real Rust convert_sync implementation. Timing is illustrative, not a benchmark.",
        conversions: captures,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "PASS: promo video, animated preview, cover and settings capture; two real Rust conversions verified.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
