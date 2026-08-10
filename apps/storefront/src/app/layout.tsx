import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Glabeekid",
    template: "%s | Glabeekid",
  },
  description:
    "Glabeekid is a playful kids fashion storefront built with Next.js and Medusa.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" suppressHydrationWarning>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
