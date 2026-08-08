import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import HomeIntroState from "@modules/layout/components/home-intro-state"

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var path = window.location.pathname;
                  var isHome = path === "/" || /^\\/[a-z]{2}(?:-[A-Z]{2})?$/.test(path);
                  document.documentElement.dataset.homeIntro = isHome ? "pending" : "complete";
                } catch (error) {
                  document.documentElement.dataset.homeIntro = "complete";
                }
              })();
            `,
          }}
        />
        <HomeIntroState />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
