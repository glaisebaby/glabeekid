import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Heading, Text } from "@modules/common/components/ui"
import Thumbnail from "@modules/products/components/thumbnail"
import QuickAddButton from "./quick-add-button"

type TrendingProductsProps = {
  countryCode: string
}

export default async function TrendingProducts({
  countryCode,
}: TrendingProductsProps) {
  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: {
      limit: 4,
      fields: "*variants.calculated_price,+variants.inventory_quantity,*variants.options",
    },
  })

  const isPurchasableVariant = (variant: (typeof products)[number]["variants"][number]) => {
    if (!variant) {
      return false
    }

    if (!variant.manage_inventory) {
      return true
    }

    if (variant.allow_backorder) {
      return true
    }

    return (variant.inventory_quantity || 0) > 0
  }

  const inStockProducts =
    products
      ?.filter((product) =>
        (product.variants ?? []).some((variant) => isPurchasableVariant(variant))
      )
      .slice(0, 4) ?? []

  if (!inStockProducts.length) {
    return null
  }

  return (
    <section className="bg-[#fbfdff] py-14 sm:py-18">
      <div className="content-container">
        <div className="mb-8 flex flex-wrap gap-3">
          <LocalizedClientLink
            href="/store"
            className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#1d1d1d]"
          >
            New in
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="border border-black/12 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#111111] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#f7f9fc]"
          >
            Everyday wear
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/collections"
            className="border border-black/12 bg-[#f3f5f7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#111111] transition-all duration-150 hover:-translate-y-0.5 hover:bg-white"
          >
            Occasion edits
          </LocalizedClientLink>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Text className="mb-3 inline-flex border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#111111]">
              Trending now
            </Text>
            <Heading level="h2" className="text-3xl text-[#111111] sm:text-4xl">
              Best-selling looks ready for quick add.
            </Heading>
            <Text className="mt-3 max-w-xl text-sm leading-7 text-[#4a4a4a] sm:text-base">
              A fast-pick strip right below the brand story, so shoppers can jump
              straight from inspiration to cart.
            </Text>
          </div>

          <LocalizedClientLink href="/store">
            <Button
              variant="secondary"
              className="h-11 border-black/12 bg-white px-5 text-[#111111] hover:bg-[#f3f5f7]"
            >
              Browse all products
            </Button>
          </LocalizedClientLink>
        </div>

        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {inStockProducts.map((product) => {
            const { cheapestPrice } = getProductPrice({ product })
            const purchasableVariants = (product.variants ?? []).filter((variant) =>
              isPurchasableVariant(variant)
            )
            const quickAddVariant =
              purchasableVariants.length === 1 ? purchasableVariants[0] : undefined
            const sizeOption = (product.options ?? []).find((option) =>
              (option.title ?? "").toLowerCase().includes("size")
            )
            const availableSizes = sizeOption
              ? Array.from(
                  new Set(
                    purchasableVariants
                      .map((variant) =>
                        variant.options?.find(
                          (option) => option.option_id === sizeOption.id
                        )?.value
                      )
                      .filter((value): value is string => Boolean(value))
                  )
                )
              : []

            return (
              <li
                key={product.id}
                className="overflow-hidden border border-black/8 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1"
              >
                <LocalizedClientLink href={`/products/${product.handle}`}>
                  <div className="p-3">
                    <Thumbnail
                      thumbnail={product.thumbnail}
                      images={product.images}
                      size="full"
                      isFeatured
                      className="bg-[#f6f7f9]"
                    />
                  </div>
                </LocalizedClientLink>

                <div className="flex flex-col gap-4 px-5 pb-5 pt-1">
                  <div className="space-y-2">
                    <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-[#767676]">
                      Glabeekid pick
                    </Text>
                    <LocalizedClientLink href={`/products/${product.handle}`}>
                      <Heading level="h3" className="text-xl text-[#111111]">
                        {product.title}
                      </Heading>
                    </LocalizedClientLink>
                    <Text className="line-clamp-2 min-h-12 text-sm leading-6 text-[#555555]">
                      {product.subtitle ||
                        "Soft, playful styling made for everyday adventures and special moments."}
                    </Text>
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <Text className="text-xs uppercase tracking-[0.18em] text-[#8f97b3]">
                        Starting from
                      </Text>
                      <Text className="mt-1 text-2xl font-semibold text-[#111111]">
                        {cheapestPrice?.calculated_price || "Price on request"}
                      </Text>
                    </div>
                    <div className="flex max-w-[42%] flex-wrap justify-end gap-1">
                      {availableSizes.length > 0 ? (
                        availableSizes.slice(0, 3).map((size) => (
                          <Text
                            key={size}
                            className="border border-black/10 bg-[#f7f7f7] px-1.5 py-0 text-[10px] font-medium leading-4 text-[#333333]"
                          >
                            {size}
                          </Text>
                        ))
                      ) : (
                        <Text className="border border-black/10 bg-[#f7f7f7] px-1.5 py-0 text-[10px] font-medium leading-4 text-[#333333]">
                          In stock
                        </Text>
                      )}
                    </div>
                  </div>

                  <QuickAddButton
                    handle={product.handle!}
                    title={product.title!}
                    variantId={quickAddVariant?.id}
                    disabled={false}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
