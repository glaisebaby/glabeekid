import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import Image from "next/image"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <footer className="w-full border-t border-[#eadfd1] bg-[linear-gradient(180deg,#fffdf9_0%,#fff6ec_100%)]">
      <div className="content-container flex w-full flex-col">
        <div className="mt-16 rounded-[34px] bg-[#1b2144] px-6 py-8 text-white shadow-[0_24px_64px_rgba(27,33,68,0.18)] sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <Text className="mb-3 inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffd37a]">
                Ready to shop
              </Text>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Make every little moment brighter with Glabeekid.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/74 sm:text-base">
                Simple browsing, cheerful color stories, and a mobile-friendly
                journey built for busy parents.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LocalizedClientLink
                href="/store"
                className="rounded-full bg-[#ffb648] px-5 py-3 text-center text-sm font-semibold text-[#1b2144]"
              >
                Shop all products
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/collections"
                className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Explore collections
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-y-10 py-16 xsmall:flex-row">
          <div className="max-w-sm">
            <LocalizedClientLink
              href="/"
              className="inline-flex overflow-hidden rounded-[24px] border border-[#e8ddd0] bg-white p-2 shadow-sm"
            >
              <Image
                src="/brand/logo-lockup.jpeg"
                alt="Glabeekid logo"
                width={360}
                height={200}
                className="h-20 w-auto rounded-[18px] object-contain"
              />
            </LocalizedClientLink>
            <p className="mt-4 max-w-sm text-small-regular text-ui-fg-subtle">
              Premium fashion for babies, toddlers, and kids with playful
              styling, clear navigation, and a launch-ready shopping experience.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-small-regular sm:grid-cols-3 md:gap-x-16">
            {productCategories && productCategories.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">Categories</span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories.slice(0, 6).map((category) => {
                    if (category.parent_category) {
                      return null
                    }

                    const children =
                      category.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                        key={category.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-ui-fg-base",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${category.handle}`}
                          data-testid="category-link"
                        >
                          {category.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="ml-3 grid grid-cols-1 gap-2">
                            {children.map((child) => (
                              <li key={child.id}>
                                <LocalizedClientLink
                                  className="hover:text-ui-fg-base"
                                  href={`/categories/${child.handle}`}
                                  data-testid="category-link"
                                >
                                  {child.name}
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">Collections</span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                    {
                      "grid-cols-2": collections.length > 3,
                    }
                  )}
                >
                  {collections.slice(0, 6).map((collection) => (
                    <li key={collection.id}>
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href={`/collections/${collection.handle}`}
                      >
                        {collection.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base">Glabeekid</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    href="/store"
                    className="hover:text-ui-fg-base"
                  >
                    Shop all
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account"
                    className="hover:text-ui-fg-base"
                  >
                    My account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/cart"
                    className="hover:text-ui-fg-base"
                  >
                    Cart
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mb-12 flex w-full flex-col gap-2 border-t border-[#eadfd1] pt-6 text-ui-fg-muted sm:flex-row sm:justify-between">
          <Text className="txt-compact-small">
            Copyright {new Date().getFullYear()} Glabeekid. All rights reserved.
          </Text>
          <Text className="txt-compact-small">
            Built for launch with Medusa, Next.js, and PostgreSQL.
          </Text>
        </div>
      </div>
    </footer>
  )
}
