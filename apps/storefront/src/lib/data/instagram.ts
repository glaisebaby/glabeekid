"use server"

import { sdk } from "@lib/config"

export type InstagramReel = {
  id: string
  caption: string
  mediaType: string
  mediaProductType: string
  mediaUrl: string
  thumbnailUrl: string
  permalink: string
  timestamp: string
}

type InstagramReelsResponse = {
  enabled: boolean
  reels: InstagramReel[]
  message?: string
}

export const listInstagramReels = async () => {
  return sdk.client
    .fetch<InstagramReelsResponse>("/store/social/instagram-reels", {
      method: "GET",
      cache: "no-store",
    })
    .catch(() => ({
      enabled: false,
      reels: [],
    }))
}
