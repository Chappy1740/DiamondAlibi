// Temporary, version-checked adapter fix for Next 16.4's preview-props manifest.
// Include its real server manifest; never substitute empty preview credentials.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.join(
  __dirname,
  "..",
  "node_modules",
  "@opennextjs",
  "cloudflare",
);
const metadata = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
if (metadata.version !== "1.20.10")
  throw new Error(
    "Review the adapter manifest fix before changing its pinned version.",
  );
const target = path.join(
  root,
  "dist",
  "cli",
  "build",
  "patches",
  "plugins",
  "load-manifest.js",
);
const original = fs.readFileSync(target, "utf8");
const needle = "**/{*-manifest,required-server-files,prefetch-hints}.json";
if (original.split(needle).length !== 2)
  throw new Error("Adapter manifest implementation changed; stop and review.");
const patched = original.replace(
  needle,
  "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json",
);
fs.writeFileSync(target, patched);
try {
  const result = spawnSync(
    process.execPath,
    [path.join(root, metadata.bin["opennextjs-cloudflare"]), "build"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        WRANGLER_SEND_METRICS: "false",
      },
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  if (fs.readFileSync(target, "utf8") !== patched)
    throw new Error(
      "Adapter changed during build; automatic restore withheld.",
    );
  fs.writeFileSync(target, original);
}
