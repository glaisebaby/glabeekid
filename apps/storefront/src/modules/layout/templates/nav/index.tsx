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
      <header className="relative mx-auto border-b border-[#f0e1d0] bg-[#fffaf4] duration-200">
        <nav className="content-container flex w-full flex-col gap-4 py-4 text-small-regular text-[#53607a]">
          <div className="flex items-center justify-between gap-4">
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
                className="flex items-center rounded-full border border-[#eadfd3] bg-white px-2 py-1 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                data-testid="nav-store-link"
              >
                <Image
                  src="/brand/logo-lockup.jpeg"
                  alt="Glabeekid"
                  width={220}
                  height={120}
                  className="h-10 w-auto rounded-full object-contain sm:h-12"
                  priority
                />
              </LocalizedClientLink>
            </div>

            <div className="flex flex-1 basis-0 items-center justify-end gap-x-6">
              <div className="hidden items-center gap-x-6 md:flex">
                <LocalizedClientLink
                  className="font-medium transition-colors hover:text-[#1b2144]"
                  href="/store"
                >
                  Shop
                </LocalizedClientLink>
                <LocalizedClientLink
                  className="font-medium transition-colors hover:text-[#1b2144]"
                  href="/collections"
                >
                  Collections
                </LocalizedClientLink>
                <LocalizedClientLink
                  className="font-medium transition-colors hover:text-[#1b2144]"
                  href="/account"
                  data-testid="nav-account-link"
                >
                  Account
                </LocalizedClientLink>
              </div>
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="flex gap-2 font-medium text-[#1b2144]"
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
