import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import { DbFileProviderService } from "./service"

export default ModuleProvider(Modules.FILE, {
  services: [DbFileProviderService],
})
