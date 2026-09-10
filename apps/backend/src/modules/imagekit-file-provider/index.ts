import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import { ImageKitFileProviderService } from "./service"

export default ModuleProvider(Modules.FILE, {
  services: [ImageKitFileProviderService],
})
