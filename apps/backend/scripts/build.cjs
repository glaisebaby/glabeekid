const { spawnSync } = require("node:child_process")

const env = {
  ...process.env,
  NODE_OPTIONS: [
    process.env.NODE_OPTIONS,
    "--max-old-space-size=4096",
  ]
    .filter(Boolean)
    .join(" "),
}

const buildResult = spawnSync("npx", ["medusa", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env,
})

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

const assetResult = spawnSync("node", ["scripts/prepare-admin-assets.cjs"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env,
})

if (assetResult.status !== 0) {
  process.exit(assetResult.status ?? 1)
}
