import { defineWidgetConfig } from "@medusajs/admin-sdk"

import logoUrl from "../assets/glabee-admin-logo.png"

const LoginBrandWidget = () => {
  return (
    <div className="mb-1 flex flex-col items-center gap-y-2">
      <img
        src={logoUrl}
        alt="Glabee store logo"
        className="h-20 w-20 rounded-full object-cover shadow-lg ring-1 ring-black/10"
      />
      <span className="txt-small-plus text-ui-fg-base">Glabee Store Admin</span>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginBrandWidget
