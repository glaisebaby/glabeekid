import { defineConfig } from "eslint/config"
import medusa from "@medusajs/eslint-plugin"

export default defineConfig([
  {
    ignores: ["public/admin/**"],
  },
  ...medusa.configs.recommended,
])
