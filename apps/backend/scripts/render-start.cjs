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

const staleChunkRecoveryScript = `
    <script>
      (function () {
        var reloadKey = "glabee-admin-stale-chunk-reload"
        var staleChunkPatterns = [
          "Failed to fetch dynamically imported module",
          "Importing a module script failed",
          "error loading dynamically imported module"
        ]

        function isStaleChunkError(value) {
          var message = String(
            value && (value.message || value.reason && value.reason.message || value.reason) || ""
          )

          return staleChunkPatterns.some(function (pattern) {
            return message.indexOf(pattern) !== -1
          })
        }

        function reloadOnce() {
          if (sessionStorage.getItem(reloadKey) === "1") {
            return
          }

          sessionStorage.setItem(reloadKey, "1")
          var url = new URL(window.location.href)
          url.searchParams.set("_admin_reload", String(Date.now()))
          window.location.replace(url.toString())
        }

        window.addEventListener("load", function () {
          sessionStorage.removeItem(reloadKey)
        })

        window.addEventListener("error", function (event) {
          if (isStaleChunkError(event.error || event.message)) {
            reloadOnce()
          }
        })

        window.addEventListener("unhandledrejection", function (event) {
          if (isStaleChunkError(event.reason)) {
            reloadOnce()
          }
        })
      })()
    </script>`

const patchAdminIndex = () => {
  if (!fs.existsSync(runtimeAdminIndexPath)) {
    return
  }

  const indexHtml = fs.readFileSync(runtimeAdminIndexPath, "utf8")

  if (indexHtml.includes("glabee-admin-stale-chunk-reload")) {
    return
  }

  fs.writeFileSync(
    runtimeAdminIndexPath,
    indexHtml.replace("</head>", `${staleChunkRecoveryScript}\n    </head>`)
  )
}

const buildResult = spawnSync("npx", ["medusa", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

if (fs.existsSync(builtAdminIndexPath)) {
  fs.rmSync(runtimeAdminDir, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(runtimeAdminDir), { recursive: true })
  fs.cpSync(builtAdminDir, runtimeAdminDir, { recursive: true })
  patchAdminIndex()
}

const result = spawnSync("npx", ["medusa", "start"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
