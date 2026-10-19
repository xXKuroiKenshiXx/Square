import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const tauri = JSON.parse(read("src-tauri/tauri.conf.json"));
assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[""].version, pkg.version);
assert.equal(tauri.version, pkg.version);
for (const path of ["src-tauri/Cargo.toml", "src-tauri/Cargo.lock"]) {
  assert.equal(read(path).match(/name = "square"\r?\nversion = "([^"]+)"/)[1], pkg.version);
}
console.log(`PASS: package, lockfiles, Rust and Tauri version (${pkg.version}).`);
