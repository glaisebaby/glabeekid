import { Suspense } from "react"
import Image from "next/image"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="glabeekid-site-nav sticky top-0 inset-x-0 z-50 group">
      <header className="relative mx-auto border-b border-black/10 bg-[#fcfcfb] duration-200">
        <nav className="content-container flex w-full flex-col gap-3 py-3 text-small-regular text-[#4c5566] sm:gap-4 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-1 basis-0 items-center md:hidden">
              <div className="h-full">
                <SideMenu
                  regions={regions}
                  locales={locales}
                  currentLocale={currentLocale}
                />
              </div>
            </div>

            <div className="flex flex-1 items-center justify-start">
              <LocalizedClientLink
                href="/"
                className="glabee-panel flex items-center bg-white px-2 py-1 hover:-translate-y-0.5"
                data-testid="nav-store-link"
              >
                <Image
                  src="/brand/logo-lockup.jpeg"
                  alt="Glabee"
                  width={220}
                  height={120}
                  className="h-10 w-auto object-contain sm:h-11"
                  priority
                />
              </LocalizedClientLink>
            </div>

            <div className="flex flex-1 basis-0 items-center justify-end gap-x-4 sm:gap-x-6">
              <div className="hidden items-center gap-x-5 lg:flex">
                <LocalizedClientLink
                  className="font-medium transition-colors hover:text-black"
                  href="/store"
                >
                  Shop
                </LocalizedClientLink>
                <LocalizedClientLink
                  className="font-medium transition-colors hover:text-black"
                  href="/collections"
                >
                  Collections
                </LocalizedClientLink>
                <LocalizedClientLink
                  className="font-medium transition-colors hover:text-black"
                  href="/account"
                  data-testid="nav-account-link"
                >
                  Account
                </LocalizedClientLink>
              </div>
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="flex gap-2 font-medium text-black"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    Cart (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
