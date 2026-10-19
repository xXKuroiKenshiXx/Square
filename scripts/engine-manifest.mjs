import { copyFileSync, chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const temporary = mkdtempSync(join(tmpdir(), "square-engine-info-"));
const engines = {};
try {
  for (const name of ["ffmpeg", "pandoc"]) {
    const bytes = readFileSync(`src-tauri/engines/${name}.bin`);
    const executable = join(temporary, name + (process.platform === "win32" ? ".exe" : ""));
    copyFileSync(`src-tauri/engines/${name}.bin`, executable);
    if (process.platform !== "win32") chmodSync(executable, 0o700);
    const output = execFileSync(executable, [name === "ffmpeg" ? "-version" : "--version"], {
      encoding: "utf8", windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024,
    }).trim();
    const firstLine = output.split(/\r?\n/)[0];
    const ref = name === "ffmpeg"
      ? firstLine.match(/-g([a-f0-9]{7,40})/)?.[1] || (firstLine.match(/version (\d+\.\d+(?:\.\d+)?)/)?.[1] && `n${firstLine.match(/version (\d+\.\d+(?:\.\d+)?)/)[1]}`)
      : firstLine.match(/pandoc (\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/)?.[1];
    if (!ref) throw new Error(`Unrecognized ${name} version: ${firstLine}`);
    engines[name] = { version: firstLine, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
      sourceRef: ref, sourceArchive: `https://github.com/${name === "ffmpeg" ? "FFmpeg/FFmpeg" : "jgm/pandoc"}/archive/${ref}.tar.gz`, versionOutput: output };
  }
  mkdirSync("release", { recursive: true });
  writeFileSync(`release/engine-manifest-${process.platform}.json`, JSON.stringify({ square: version, platform: process.platform, arch: process.arch, engines }, null, 2) + "\n");
  console.log(`PASS: ${process.platform} embedded engine versions and SHA-256 recorded for Square ${version}.`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
