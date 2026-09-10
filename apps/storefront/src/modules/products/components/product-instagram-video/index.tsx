import InstagramEmbed from "@modules/common/components/instagram-embed"
import { Heading, Text } from "@modules/common/components/ui"

type ProductInstagramVideoProps = {
  productTitle?: string | null
  metadata?: Record<string, unknown> | null
}

const ProductInstagramVideo = ({
  productTitle,
  metadata,
}: ProductInstagramVideoProps) => {
  const instagramUrl = metadata?.instagram_reel_url

  if (typeof instagramUrl !== "string" || !instagramUrl.trim()) {
    return null
  }

  return (
    <section
      className="content-container mb-16"
      data-testid="product-instagram-video"
    >
      <div className="mx-auto max-w-3xl">
        <Text className="mb-3 inline-flex border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f08a24]">
          Instagram
        </Text>
        <Heading level="h2" className="mb-6 text-2xl text-[#111111]">
          Product video
        </Heading>
        <InstagramEmbed
          url={instagramUrl}
          title={`${productTitle || "Product"} Instagram video`}
        />
      </div>
    </section>
  )
}

export default ProductInstagramVideo
