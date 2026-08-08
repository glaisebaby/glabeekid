const { spawnSync } = require("node:child_process")

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_PRODUCTION) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION
}

const commands = [
  ["npx", ["medusa", "db:setup"]],
  ["npx", ["medusa", "start"]],
]

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
