import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@modules/common/components/ui"
import { listNotFitToSaleItems } from "@lib/data/india-ops"

export const metadata = {
  title: "Not Fit to Sale | Glabee",
}

export default async function NotFitToSalePage() {
  const items = await listNotFitToSaleItems()

  return (
    <div className="content-container py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Text className="mb-3 inline-flex rounded-full bg-[#ffe3b9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9a5b00]">
            India operations
          </Text>
          <Heading level="h1" className="text-4xl text-[#1b2144]">
            Not Fit to Sale
          </Heading>
          <Text className="mt-3 max-w-3xl text-base leading-7 text-[#5c6480]">
            Items moved here failed inspection and should stay out of sellable
            inventory until repaired, written off, or repurposed.
          </Text>
        </div>
        <LocalizedClientLink href="/ops/returns" className="text-sm font-medium text-[#1b2144] underline-offset-4 hover:underline">
          Back to returns desk
        </LocalizedClientLink>
      </div>

      <section className="rounded-[28px] border border-[#f0dcc7] bg-white p-6 shadow-[0_18px_44px_rgba(27,33,68,0.06)]">
        {items.length ? (
          <div className="grid gap-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[24px] border border-[#efd6d6] bg-[#fff5f5] p-5"
              >
                <Heading level="h2" className="text-2xl text-[#1b2144]">
                  {item.productTitle}
                </Heading>
                <Text className="mt-2 text-sm text-[#5c6480]">
                  Order #{item.orderDisplayId}
                  {item.variantTitle ? ` • ${item.variantTitle}` : ""}
                  {item.sku ? ` • SKU ${item.sku}` : ""}
                </Text>
                <Text className="mt-2 text-sm text-[#5c6480]">
                  Quantity: {item.quantity}
                </Text>
                <Text className="mt-2 text-sm text-[#8b2f2f]">
                  Inspection status: {item.inspectionStatus} • Refund:{" "}
                  {item.refundStatus}
                </Text>
              </article>
            ))}
          </div>
        ) : (
          <Text className="text-sm leading-6 text-[#5c6480]">
            No returned items have been moved into the Not Fit to Sale section.
          </Text>
        )}
      </section>
    </div>
  )
}
