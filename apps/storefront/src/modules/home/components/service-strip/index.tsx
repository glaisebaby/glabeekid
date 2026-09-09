import { Heading, Text } from "@modules/common/components/ui"

const points = [
  {
    title: "Easy to browse",
    description: "Clear sections, quick add moments, and mobile-friendly cards keep shopping light and fast.",
  },
  {
    title: "India-first shopping",
    description: "Clear local pricing, delivery messaging, and workflows shaped around your current launch market.",
  },
  {
    title: "Fit confidence",
    description: "Size guide access sits near product options so parents can choose faster with less guesswork.",
  },
  {
    title: "Returns ready",
    description: "Operational tools are already prepared for refund, inspection, and not-fit-to-sale handling.",
  },
]

export default function ServiceStrip() {
  return (
    <section className="bg-[#1b2144] py-14 text-white sm:py-16">
      <div className="content-container">
        <div className="mb-8 max-w-2xl">
          <Heading level="h2" className="text-3xl sm:text-4xl">
            A storefront that feels smooth for parents and playful for the brand.
          </Heading>
          <Text className="mt-4 text-sm leading-7 text-white/78 sm:text-base">
            Designed to make discovery, sizing, and checkout feel effortless on
            phones first, while still looking premium on larger screens.
          </Text>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {points.map((point) => (
            <div
              key={point.title}
              className="border border-white/12 bg-white/8 p-5 backdrop-blur-md"
            >
              <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd37a]">
                Glabee UX
              </Text>
              <Heading level="h3" className="mt-3 text-xl">
                {point.title}
              </Heading>
              <Text className="mt-3 text-sm leading-7 text-white/75">
                {point.description}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
