import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@modules/common/components/ui"

type Props = {
  params: Promise<{ countryCode: string }>
}

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Explore Glabeekid collections for ladies, mens, kids, everyday outfits, and occasionwear.",
}

export default async function CollectionsPage(_props: Props) {
  const { collections } = await listCollections({
    fields: "id, handle, title, *products",
  })

  return (
    <div className="bg-[linear-gradient(180deg,#fff8ef_0%,#fbfdff_46%,#fffdf9_100%)]">
      <section className="content-container py-14 sm:py-20">
        <div className="mb-10 max-w-3xl">
          <Text className="mb-3 inline-flex border border-black/10 bg-[#ffe3b9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9a5b00]">
            Glabee edits
          </Text>
          <Heading level="h1" className="text-4xl text-[#111111] sm:text-5xl">
            Shop every collection in one cheerful place.
          </Heading>
          <Text className="mt-4 max-w-2xl text-base leading-7 text-[#5e6783]">
            Browse curated product groups and jump into the styles that fit the
            moment, from everyday picks to special occasion looks.
          </Text>
        </div>

        {collections?.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection, index) => (
              <li key={collection.id}>
                <LocalizedClientLink
                  href={`/collections/${collection.handle}`}
                  className="group flex min-h-56 flex-col justify-between overflow-hidden border border-black/8 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div>
                    <div className="mb-6 h-28 bg-[radial-gradient(circle_at_30%_20%,#fff8c9_0%,#ffbf70_36%,#67c7b6_70%,#3b6fd8_100%)] opacity-95 transition-transform duration-300 group-hover:scale-[1.03]" />
                    <Text className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f08a24]">
                      Collection {index + 1}
                    </Text>
                    <Heading
                      level="h2"
                      className="mt-2 text-2xl text-[#1b2144]"
                    >
                      {collection.title}
                    </Heading>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-4">
                    <Text className="text-sm text-[#6b7280]">
                      {collection.products?.length ?? 0} products
                    </Text>
                    <Text className="text-sm font-semibold uppercase tracking-[0.18em] text-[#111111]">
                      Explore
                    </Text>
                  </div>
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-dashed border-black/20 bg-white p-8">
            <Heading level="h2" className="text-2xl text-[#111111]">
              No collections yet
            </Heading>
            <Text className="mt-3 max-w-xl text-sm leading-7 text-[#5e6783]">
              Collections created in admin will appear here once they are
              available to the storefront.
            </Text>
          </div>
        )}
      </section>
    </div>
  )
}
