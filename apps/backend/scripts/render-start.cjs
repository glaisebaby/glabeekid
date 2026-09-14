const { spawnSync } = require("node:child_process")

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_PRODUCTION) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION
}

const buildResult = spawnSync("npx", ["medusa", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

const assetResult = spawnSync("node", ["scripts/prepare-admin-assets.cjs"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (assetResult.status !== 0) {
  process.exit(assetResult.status ?? 1)
}

const result = spawnSync("npx", ["medusa", "start"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
