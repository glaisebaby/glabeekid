import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

import logoUrl from "../assets/glabee-admin-logo.png"

const LoginBrandWidget = () => {
  useEffect(() => {
    const marker = document.querySelector("[data-glabee-login-brand]")
    const widgetContainer = marker?.closest(".flex.w-full.flex-col.gap-y-3")
    const loginCard = widgetContainer?.parentElement
    const defaultHeaderElements = loginCard
      ? Array.from(loginCard.children).slice(0, 2)
      : []

    defaultHeaderElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.dataset.glabeeOriginalDisplay = element.style.display
        element.style.display = "none"
      }
    })

    return () => {
      defaultHeaderElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.style.display = element.dataset.glabeeOriginalDisplay ?? ""
          delete element.dataset.glabeeOriginalDisplay
        }
      })
    }
  }, [])

  return (
    <div data-glabee-login-brand className="mb-1 flex flex-col items-center gap-y-2">
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
