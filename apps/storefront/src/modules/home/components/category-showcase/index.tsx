import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@modules/common/components/ui"

const cards = [
  {
    title: "Festive Twirls",
    description: "Bright occasionwear and standout party fits for birthdays and celebrations.",
    accent: "from-[#ffd584] via-[#ffb85c] to-[#ff8f52]",
  },
  {
    title: "Everyday Play",
    description: "Soft cotton sets, easy layers, and comfort-first looks for daily movement.",
    accent: "from-[#8de0c3] via-[#59c4a2] to-[#3b9e9a]",
  },
  {
    title: "Tiny Trendsetters",
    description: "Fresh silhouettes and playful color stories for little fashion explorers.",
    accent: "from-[#91c8ff] via-[#5da2ff] to-[#5469e8]",
  },
]

export default function CategoryShowcase() {
  return (
    <section className="bg-[linear-gradient(180deg,#fff8ef_0%,#fffdf9_100%)] py-14 sm:py-18">
      <div className="content-container">
        <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Text className="mb-3 inline-flex rounded-full bg-[#ffe3b9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9a5b00]">
              Shop by mood
            </Text>
            <Heading level="h2" className="text-3xl text-[#1b2144] sm:text-4xl">
              Built for parents who want fast choices and joyful style.
            </Heading>
          </div>
          <Text className="max-w-xl text-sm leading-7 text-[#5e6783] sm:text-base">
            A clean mobile-first layout, bright color accents, and easy entry
            points into the most shopped kidswear moments.
          </Text>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {cards.map((card) => (
            <LocalizedClientLink
              key={card.title}
              href="/store"
              className="group relative overflow-hidden rounded-[30px] border border-[#f0dcc7] bg-white p-6 shadow-[0_18px_46px_rgba(27,33,68,0.08)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div
                className={`mb-6 h-32 rounded-[24px] bg-gradient-to-br ${card.accent} opacity-95`}
              />
              <Heading level="h3" className="text-2xl text-[#1b2144]">
                {card.title}
              </Heading>
              <Text className="mt-3 text-sm leading-7 text-[#5e6783]">
                {card.description}
              </Text>
              <Text className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#f08a24]">
                Explore styles
              </Text>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}
