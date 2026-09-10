import { listInstagramReels } from "@lib/data/instagram"
import { Heading, Text } from "@modules/common/components/ui"
import Image from "next/image"

const getCaptionPreview = (caption: string) => {
  const trimmed = caption.trim()

  if (!trimmed) {
    return "Watch on Instagram"
  }

  return trimmed.length > 96 ? `${trimmed.slice(0, 96)}...` : trimmed
}

const InstagramReels = async () => {
  const { enabled, reels } = await listInstagramReels()

  if (!enabled || !reels.length) {
    return null
  }

  return (
    <section className="border-y border-black/8 bg-[#fffaf3] py-12 sm:py-16">
      <div className="content-container">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Text className="mb-3 inline-flex border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f08a24]">
              Instagram
            </Text>
            <Heading level="h2" className="text-3xl text-[#111111] sm:text-4xl">
              Latest reels
            </Heading>
          </div>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-[#111111] underline underline-offset-4"
          >
            Open Instagram
          </a>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reels.map((reel) => (
            <li key={reel.id}>
              <a
                href={reel.permalink}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden border border-black/8 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/5] bg-[#f6f7f9]">
                  {reel.thumbnailUrl ? (
                    <Image
                      src={reel.thumbnailUrl}
                      alt={reel.caption || "Instagram reel"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Text className="text-sm text-ui-fg-subtle">
                        Instagram reel
                      </Text>
                    </div>
                  )}
                  <span className="absolute bottom-4 left-4 inline-flex bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    Play reel
                  </span>
                </div>
                <Text className="line-clamp-2 min-h-14 px-4 py-4 text-sm leading-7 text-[#4a4a4a]">
                  {getCaptionPreview(reel.caption)}
                </Text>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default InstagramReels
