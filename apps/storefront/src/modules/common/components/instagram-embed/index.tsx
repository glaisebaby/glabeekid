import { getInstagramEmbedUrl } from "@lib/util/instagram"

type InstagramEmbedProps = {
  url: string
  title?: string
  className?: string
}

const InstagramEmbed = ({
  url,
  title = "Instagram video",
  className = "",
}: InstagramEmbedProps) => {
  const embedUrl = getInstagramEmbedUrl(url)

  if (!embedUrl) {
    return null
  }

  return (
    <div
      className={`overflow-hidden border border-black/10 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)] ${className}`}
    >
      <iframe
        src={embedUrl}
        title={title}
        className="h-[620px] w-full bg-white"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      />
    </div>
  )
}

export default InstagramEmbed
