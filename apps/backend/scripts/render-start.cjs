const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_PRODUCTION) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION
}

const builtAdminDir = path.join(
  process.cwd(),
  ".medusa",
  "server",
  "public",
  "admin"
)

const runtimeAdminDir = path.join(process.cwd(), "public", "admin")
const runtimeAdminIndexPath = path.join(runtimeAdminDir, "index.html")
const builtAdminIndexPath = path.join(builtAdminDir, "index.html")

if (!fs.existsSync(builtAdminIndexPath)) {
  const buildResult = spawnSync("npx", ["medusa", "build"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  })

  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1)
  }
}

if (fs.existsSync(builtAdminIndexPath)) {
  fs.rmSync(runtimeAdminDir, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(runtimeAdminDir), { recursive: true })
  fs.cpSync(builtAdminDir, runtimeAdminDir, { recursive: true })
}

const result = spawnSync("npx", ["medusa", "start"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
