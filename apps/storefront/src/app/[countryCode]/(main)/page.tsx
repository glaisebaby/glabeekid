import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import CategoryShowcase from "@modules/home/components/category-showcase"
import Hero from "@modules/home/components/hero"
import ServiceStrip from "@modules/home/components/service-strip"
import TrendingProducts from "@modules/home/components/trending-products"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Kids Fashion for Every Little Moment",
  description:
    "Discover colorful outfits, occasionwear, and everyday essentials for babies, toddlers, and growing kids.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <TrendingProducts countryCode={countryCode} />
      <CategoryShowcase />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      <ServiceStrip />
    </>
  )
}
