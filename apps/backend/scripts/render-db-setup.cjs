const { spawnSync } = require("node:child_process")

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_PRODUCTION) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION
}

const result = spawnSync("npx", ["medusa", "db:setup"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
