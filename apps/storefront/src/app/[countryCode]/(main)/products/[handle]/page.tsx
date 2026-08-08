import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  const galleryImages = !selectedVariantId || !product.variants
    ? product.images
    : (() => {
        const variant = product.variants!.find((v) => v.id === selectedVariantId)
        if (!variant || !variant.images?.length) {
          return product.images
        }

        const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
        return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
      })()

  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const imageValues = [
    metadata.size_chart_image_url,
    metadata.size_chart_image_urls,
  ].flatMap((value) => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string")
    }

    if (typeof value === "string") {
      return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    }

    return []
  })

  const existingUrls = new Set(
    (galleryImages ?? []).map((image) => image.url).filter(Boolean)
  )

  const sizeChartImages = imageValues
    .filter((url) => !existingUrls.has(url))
    .map((url, index) => ({
      id: `size-chart-${index}`,
      url,
    })) as HttpTypes.StoreProductImage[]

  return [...(galleryImages ?? []), ...sizeChartImages]
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | Glabeekid`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Glabeekid`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  if (!pricedProduct) {
    notFound()
  }

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images ?? []}
    />
  )
}
