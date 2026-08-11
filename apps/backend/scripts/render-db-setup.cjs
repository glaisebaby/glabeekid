const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_PRODUCTION) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing at runtime.")
  process.exit(1)
}

const envFilePath = path.join(process.cwd(), ".env")
const envLines = []

if (fs.existsSync(envFilePath)) {
  envLines.push(fs.readFileSync(envFilePath, "utf8").trim())
}

envLines.push(`DATABASE_URL=${process.env.DATABASE_URL}`)

if (process.env.DATABASE_URL_PRODUCTION) {
  envLines.push(
    `DATABASE_URL_PRODUCTION=${process.env.DATABASE_URL_PRODUCTION}`
  )
}

fs.writeFileSync(
  envFilePath,
  `${envLines.filter(Boolean).join("\n")}\n`,
  "utf8"
)

const result = spawnSync("npx", ["medusa", "db:setup"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

const indiaProfileResult = spawnSync(
  "node",
  [path.join(process.cwd(), "scripts", "ensure-india-profile.cjs")],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  }
)

if (indiaProfileResult.status !== 0) {
  process.exit(indiaProfileResult.status ?? 1)
}
