import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { listProducts } from "./products"

export const hasVisibleCategoryProducts = async (
  category: HttpTypes.StoreProductCategory,
  countryCode: string
): Promise<boolean> => {
  const {
    response: { count },
  } = await listProducts({
    countryCode,
    queryParams: {
      category_id: [category.id],
      limit: 1,
      fields: "id",
    },
  })

  if (count > 0) {
    return true
  }

  const childResults = await Promise.all(
    (category.category_children ?? []).map((child) =>
      hasVisibleCategoryProducts(child, countryCode)
    )
  )

  return childResults.some(Boolean)
}

export const getVisibleCategories = async (
  categories: HttpTypes.StoreProductCategory[],
  countryCode: string
) => {
  const results = await Promise.all(
    categories.map(async (category) => ({
      category,
      isVisible: await hasVisibleCategoryProducts(category, countryCode),
    }))
  )

  return results
    .filter(({ isVisible }) => isVisible)
    .map(({ category }) => category)
}

export const listCategories = async (query?: Record<string, unknown>) => {
  const next = {
    ...(await getCacheOptions("categories")),
  }

  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields:
            "*category_children, *category_children.products, *products, *parent_category, *parent_category.parent_category",
          limit,
          ...query,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories)
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  const next = {
    ...(await getCacheOptions("categories")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: "*category_children, *category_children.products, *products",
          handle,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
