import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCategoryByHandle,
  getVisibleCategories,
  hasVisibleCategoryProducts,
  listCategories,
} from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { parseOptionValueIds } from "@lib/util/product-option-filters"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      sortBy?: SortOptions
      page?: string
      optionValueIds?: string | string[]
    }
  >
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const staticParams = (
    await Promise.all(
      countryCodes?.filter(Boolean).map(async (countryCode) => {
        const visibleCategories = await getVisibleCategories(
          product_categories,
          countryCode!
        )

        return visibleCategories.map((category: HttpTypes.StoreProductCategory) => ({
          countryCode,
          category: [category.handle],
        }))
      }) ?? []
    )
  ).flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    if (!(await hasVisibleCategoryProducts(productCategory, params.countryCode))) {
      notFound()
    }

    const title = productCategory.name + " | Glabee"

    const description = productCategory.description ?? `${title} category.`

    return {
      title,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  const productCategory = await getCategoryByHandle(params.category)

  if (
    !productCategory ||
    !(await hasVisibleCategoryProducts(productCategory, params.countryCode))
  ) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      optionValueIds={optionValueIds}
    />
  )
}
