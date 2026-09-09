import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className="border border-black/8 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1"
      >
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="mt-4 flex items-start justify-between gap-3 txt-compact-medium">
          <div>
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f08a24]">
              Glabee
            </Text>
            <Text className="mt-2 text-[#1b2144]" data-testid="product-title">
              {product.title}
            </Text>
          </div>
          <div className="flex items-center gap-x-2 text-right">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
