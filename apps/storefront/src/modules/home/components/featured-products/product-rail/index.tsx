import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "id,title,handle,thumbnail,*images,*variants.calculated_price",
    },
  })

  const visibleProducts = (pricedProducts ?? []).filter((product) => {
    const hasImage = Boolean(product.thumbnail || product.images?.[0]?.url)
    const { cheapestPrice } = getProductPrice({ product })

    return hasImage && Boolean(cheapestPrice)
  })

  if (!visibleProducts.length) {
    return null
  }

  return (
    <div className="content-container py-14 small:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f08a24]">
            Collection
          </Text>
          <Text className="txt-xlarge text-[#1b2144]">{collection.title}</Text>
        </div>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-12 small:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} isFeatured />
          </li>
        ))}
      </ul>
    </div>
  )
}
