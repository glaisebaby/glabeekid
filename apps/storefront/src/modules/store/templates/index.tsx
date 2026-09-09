import { Suspense } from "react"

import { OptionValueIds } from "@lib/util/product-option-filters"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div
      className="content-container py-8 sm:py-10"
      data-testid="category-container"
    >
      <div className="mb-8 border border-black/8 bg-[linear-gradient(135deg,#fff7ea_0%,#ffffff_55%,#f3f8ff_100%)] px-5 py-7 sm:px-8">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4a00]">
            Glabee catalog
          </p>
          <h1
            className="text-3xl font-semibold text-[#1b2144] sm:text-4xl"
            data-testid="store-page-title"
          >
            Products
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-8 small:flex-row small:items-start">
        <div className="small:sticky small:top-32">
          <div className="border border-black/8 bg-[#fffdf9] pr-2 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <RefinementList sortBy={sort} />
          </div>
        </div>
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
