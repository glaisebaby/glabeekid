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
      <div className="mb-8 rounded-[32px] bg-[linear-gradient(135deg,#fff3de_0%,#fffaf4_55%,#eef6ff_100%)] px-6 py-8 sm:px-8">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9a5b00] shadow-sm">
            Glabeekid catalog
          </p>
          <h1
            className="text-3xl font-semibold text-[#1b2144] sm:text-4xl"
            data-testid="store-page-title"
          >
            Easy shopping for bright little wardrobes.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d6782] sm:text-base">
            Filter by fit and browse calmly across playful styles, soft basics,
            and occasion-ready looks designed for everyday Indian families.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8 small:flex-row small:items-start">
        <div className="small:sticky small:top-32">
          <div className="rounded-[28px] border border-[#f0dcc7] bg-[#fffdf9] pr-2 shadow-[0_16px_40px_rgba(27,33,68,0.06)]">
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
