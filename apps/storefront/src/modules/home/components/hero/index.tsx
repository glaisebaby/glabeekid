"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Heading, IconButton } from "@modules/common/components/ui"

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [hasCompletedFirstPlay, setHasCompletedFirstPlay] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [soundBlocked, setSoundBlocked] = useState(false)
  const [audioStateResolved, setAudioStateResolved] = useState(false)

  const markVideoReady = () => {
    setVideoReady(true)
  }

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    const startPlayback = async () => {
      try {
        video.muted = false
        await video.play()
        setIsMuted(false)
        setSoundBlocked(false)
        setVideoPlaying(true)
      } catch {
        video.muted = true
        setIsMuted(true)
        setSoundBlocked(true)

        try {
          await video.play()
          setVideoPlaying(true)
        } catch {}
      } finally {
        setAudioStateResolved(true)
      }
    }

    void startPlayback()
  }, [])

  useEffect(() => {
    if (!hasCompletedFirstPlay) {
      return
    }

    window.dispatchEvent(new Event("glabeekid:intro-complete"))
  }, [hasCompletedFirstPlay])

  const toggleMute = async () => {
    const video = videoRef.current

    if (!video) {
      return
    }

    const nextMuted = !video.muted
    video.muted = nextMuted
    setIsMuted(nextMuted)

    if (!nextMuted) {
      try {
        await video.play()
        setSoundBlocked(false)
        setVideoPlaying(true)
      } catch {
        video.muted = true
        setIsMuted(true)
        setSoundBlocked(true)
      }
    }
  }

  const showHeroHeadline = !videoPlaying || hasCompletedFirstPlay
  const showRevealCards = hasCompletedFirstPlay

  return (
    <section className="border-b border-ui-border-base bg-[#f4faff]">
      <div className="relative flex min-h-[82vh] items-end overflow-hidden bg-[#deedf8] sm:min-h-[92vh]">
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            videoReady ? "opacity-0" : "opacity-100"
          }`}
        >
          <Image
            src="/brand/brand-banner.jpeg"
            alt="Glabeekid brand banner"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(29,36,69,0.72),rgba(29,36,69,0.22)_48%,rgba(255,248,239,0.10))]" />
        </div>

        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover object-[62%_center] transition-opacity duration-1000 sm:object-center ${
            videoReady || videoPlaying ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          playsInline
          preload="auto"
          poster="/brand/brand-banner.jpeg"
          onLoadedMetadata={markVideoReady}
          onLoadedData={markVideoReady}
          onCanPlay={markVideoReady}
          onPlay={() => {
            setVideoPlaying(true)
            markVideoReady()
          }}
          onPause={() => setVideoPlaying(false)}
          onEnded={() => {
            const video = videoRef.current

            setHasCompletedFirstPlay(true)
            setVideoPlaying(false)
            setIsMuted(true)
            setSoundBlocked(false)

            if (!video) {
              return
            }

            video.muted = true
            video.currentTime = 0
            void video.play().then(() => {
              setVideoPlaying(true)
            })
          }}
        >
          <source src="/brand/intro-video.mp4" type="video/mp4" />
        </video>

        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            videoPlaying && !hasCompletedFirstPlay ? "opacity-0" : "opacity-100"
          } bg-[linear-gradient(120deg,rgba(19,25,52,0.9),rgba(30,36,72,0.56)_44%,rgba(255,255,255,0.08)_100%)]`}
        />
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            videoPlaying && !hasCompletedFirstPlay ? "opacity-0" : "opacity-100"
          } bg-[radial-gradient(circle_at_top_right,rgba(255,191,90,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(87,207,168,0.18),transparent_36%)]`}
        />

        <IconButton
          onClick={() => void toggleMute()}
          className="absolute right-6 top-6 z-20 h-12 w-12 rounded-full border border-white/20 bg-white/12 text-white backdrop-blur-md transition-colors hover:bg-white/18 sm:right-8 sm:top-8 lg:right-12 lg:top-10"
          aria-label={
            !audioStateResolved
              ? "Loading video audio"
              : isMuted
              ? "Unmute video"
              : "Mute video"
          }
        >
          {!audioStateResolved ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5 6.8 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.8L11 19z" />
              <path d="M15.5 12h.01" />
              <path d="M18.5 12h.01" />
            </svg>
          ) : isMuted ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5 6.8 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.8L11 19z" />
              <path d="m16 9 5 6" />
              <path d="m21 9-5 6" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5 6.8 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.8L11 19z" />
              <path d="M15.5 9.5a4.5 4.5 0 0 1 0 5" />
              <path d="M18.5 7a8 8 0 0 1 0 10" />
            </svg>
          )}
          <span className="sr-only">
            {!audioStateResolved
              ? "Loading video audio"
              : isMuted
              ? "Unmute video"
              : "Mute video"}
          </span>
        </IconButton>

        <div className="content-container relative z-10 grid w-full gap-10 px-6 py-12 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_320px] lg:px-12 lg:py-16">
          <div className="flex max-w-3xl flex-col justify-end">
            <Heading
              level="h1"
              className={`relative max-w-3xl text-[2.85rem] font-black italic leading-[0.94] tracking-[-0.04em] transition-all duration-700 sm:text-5xl lg:text-[5.3rem] ${
                showHeroHeadline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <span className="text-white">
                Playful fashion for little explorers.
              </span>
              {hasCompletedFirstPlay ? (
                <span
                  aria-hidden="true"
                  className="glabeekid-rainbow-overlay absolute inset-0"
                >
                  Playful fashion for little explorers.
                </span>
              ) : null}
            </Heading>

            <Heading
              level="h2"
              className={`mt-4 max-w-xl text-sm font-normal leading-6 text-white/84 transition-all duration-700 sm:mt-5 sm:max-w-2xl sm:text-xl sm:leading-7 ${
                showHeroHeadline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Your logo, banner, and intro story now lead the storefront with a
              polished media-first landing experience made for a new-generation
              kids fashion brand.
            </Heading>

            <div
              className={`mt-7 flex flex-col gap-4 transition-all duration-700 sm:mt-8 sm:flex-row ${
                showHeroHeadline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <LocalizedClientLink href="/store">
                <Button className="h-12 rounded-full bg-[#ffb648] px-6 text-[#1b2144] hover:bg-[#ffcb74]">
                  Shop the catalog
                </Button>
              </LocalizedClientLink>
              <LocalizedClientLink href="/collections">
                <Button
                  variant="secondary"
                  className="h-12 rounded-full border-white/35 bg-white/10 px-6 text-white backdrop-blur-md hover:bg-white/18"
                >
                  Explore collections
                </Button>
              </LocalizedClientLink>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 lg:items-end">
            <div className="grid w-full gap-4 md:grid-cols-3 lg:grid-cols-1 lg:max-w-[290px]">
              <div
                className={`rounded-[24px] border border-white/18 bg-white/12 p-5 text-white/92 backdrop-blur-md transition-all duration-700 ${
                  showRevealCards
                    ? "glabeekid-rise-in opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={showRevealCards ? { animationDelay: "0.08s" } : undefined}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                  Smart discovery
                </p>
                <p className="mt-3 text-sm leading-6">
                  Search by age, size, color, and special occasion.
                </p>
              </div>
              <div
                className={`rounded-[24px] border border-white/18 bg-white/12 p-5 text-white/92 backdrop-blur-md transition-all duration-700 ${
                  showRevealCards
                    ? "glabeekid-rise-in opacity-100"
                    : "translate-y-12 opacity-0"
                }`}
                style={showRevealCards ? { animationDelay: "0.18s" } : undefined}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                  Brand-first loading
                </p>
                <p className="mt-3 text-sm leading-6">
                  The banner carries the first impression while the video fades in.
                </p>
              </div>
              <div
                className={`rounded-[24px] border border-white/18 bg-white/12 p-5 text-white/92 backdrop-blur-md transition-all duration-700 ${
                  showRevealCards
                    ? "glabeekid-rise-in opacity-100"
                    : "translate-y-14 opacity-0"
                }`}
                style={showRevealCards ? { animationDelay: "0.28s" } : undefined}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                  Audio aware
                </p>
                <p className="mt-3 text-sm leading-6">
                  {soundBlocked
                    ? "If your browser blocks autoplay sound, use the button above to enable it."
                    : "Video sound is enabled, and you can mute it any time."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
