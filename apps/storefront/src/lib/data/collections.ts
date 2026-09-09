"use server"

import { sdk } from "@lib/config"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { listProducts } from "./products"

export const retrieveCollection = async (id: string) => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return await sdk.client
    .fetch<{ collection: HttpTypes.StoreCollection }>(
      `/store/collections/${id}`,
      {
        next,
        cache: "force-cache",
      }
    )
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return await sdk.client
    .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
      "/store/collections",
      {
        query: queryParams,
        next,
        cache: "force-cache",
      }
    )
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection | null> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
      query: { handle, fields: "*products" },
      next,
      cache: "force-cache",
    })
    .then(({ collections }) => collections[0] || null)
}

export const getVisibleCollections = async (
  collections: HttpTypes.StoreCollection[],
  countryCode: string
) => {
  const visibility = await Promise.all(
    collections.map(async (collection) => {
      const {
        response: { products },
      } = await listProducts({
        countryCode,
        queryParams: {
          collection_id: collection.id,
          limit: 100,
          fields: "id,thumbnail,*images,*variants.calculated_price",
        },
      })

      const hasVisibleProduct = products.some((product) => {
        const hasImage = Boolean(product.thumbnail || product.images?.[0]?.url)
        const { cheapestPrice } = getProductPrice({ product })

        return hasImage && Boolean(cheapestPrice)
      })

      return hasVisibleProduct ? collection : null
    })
  )

  return visibility.filter(
    (collection): collection is HttpTypes.StoreCollection => Boolean(collection)
  )
}
