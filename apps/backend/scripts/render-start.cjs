const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_PRODUCTION) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION
}

const adminIndexPath = path.join(
  process.cwd(),
  ".medusa",
  "server",
  "public",
  "admin",
  "index.html"
)

if (!fs.existsSync(adminIndexPath)) {
  const buildResult = spawnSync("npx", ["medusa", "build"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  })

  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1)
  }
}

const result = spawnSync("npx", ["medusa", "start"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
