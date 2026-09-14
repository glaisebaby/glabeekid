const fs = require("node:fs")
const path = require("node:path")

const builtAdminDir = path.join(
  process.cwd(),
  ".medusa",
  "server",
  "public",
  "admin"
)
const runtimeAdminDir = path.join(process.cwd(), "public", "admin")

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

const patchAdminIndex = (indexPath) => {
  if (!fs.existsSync(indexPath)) {
    return false
  }

  const indexHtml = fs.readFileSync(indexPath, "utf8")

  if (indexHtml.includes("glabee-admin-stale-chunk-reload")) {
    return true
  }

  fs.writeFileSync(
    indexPath,
    indexHtml.replace("</head>", `${staleChunkRecoveryScript}\n    </head>`)
  )

  return true
}

const builtAdminIndexPath = path.join(builtAdminDir, "index.html")

if (!patchAdminIndex(builtAdminIndexPath)) {
  console.warn("Admin index was not found, skipping admin asset preparation.")
  process.exit(0)
}

fs.rmSync(runtimeAdminDir, { recursive: true, force: true })
fs.mkdirSync(path.dirname(runtimeAdminDir), { recursive: true })
fs.cpSync(builtAdminDir, runtimeAdminDir, { recursive: true })

console.log("Prepared admin assets.")
