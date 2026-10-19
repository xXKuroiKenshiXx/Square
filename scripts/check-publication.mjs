import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["AWS key", /AKIA[A-Z0-9]{16}/],
  ["API secret", /sk-[A-Za-z0-9]{32,}/],
  ["local user path", /[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s]+/],
];
let failed = false;
for (const name of new Set(files)) {
  const bytes = readFileSync(name);
  if (bytes.includes(0) || bytes.length > 5 * 1024 * 1024) continue;
  const text = bytes.toString("utf8");
  for (const [label, pattern] of patterns)
    if (pattern.test(text)) {
      console.error(`${name}: possible ${label} (value redacted)`);
      failed = true;
    }
}
const revisions = execFileSync("git", ["rev-list", "--all"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);
for (const revision of revisions) {
  for (const [label, pattern] of patterns.slice(0, 4)) {
    let paths = "";
    try {
      paths = execFileSync(
        "git",
        ["grep", "-I", "-l", "-P", "-e", pattern.source, revision],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
    } catch (error) {
      if (error.status !== 1) throw error;
    }
    if (paths) {
      console.error(
        `${revision.slice(0, 8)}: possible historical ${label} (value redacted)`,
      );
      failed = true;
    }
  }
}
if (failed) process.exitCode = 1;
else
  console.log(
    `PASS: ${new Set(files).size} files and ${revisions.length} revisions checked for common secret patterns; no local user paths in current text files.`,
  );
