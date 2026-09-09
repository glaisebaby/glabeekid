"use client"

import { Dialog, Transition } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import useToggleState from "@lib/hooks/use-toggle-state"
import Image from "next/image"
import { Fragment, useEffect, useMemo, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const clampIndex = (index: number, total: number) => {
  if (total === 0) {
    return 0
  }

  if (index < 0) {
    return total - 1
  }

  if (index >= total) {
    return 0
  }

  return index
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const galleryImages = useMemo(
    () => images.filter((image): image is HttpTypes.StoreProductImage & { url: string } => Boolean(image.url)),
    [images]
  )
  const { state, open, close } = useToggleState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const activeImage = galleryImages[activeIndex]

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    setIsZoomed(false)
    open()
  }

  const goToImage = (index: number) => {
    setActiveIndex(clampIndex(index, galleryImages.length))
    setIsZoomed(false)
  }

  const goToNext = () => {
    goToImage(activeIndex + 1)
  }

  const goToPrevious = () => {
    goToImage(activeIndex - 1)
  }

  useEffect(() => {
    if (!state) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        goToNext()
      }

      if (event.key === "ArrowLeft") {
        goToPrevious()
      }

      if (event.key.toLowerCase() === "z") {
        setIsZoomed((current) => !current)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [state, activeIndex, galleryImages.length])

  return (
    <>
      <div className="flex items-start relative">
        <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
          {galleryImages.map((image, index) => {
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => openLightbox(index)}
                className="block text-left"
                aria-label={`Open product image ${index + 1}`}
              >
                <Container
                  className="group relative aspect-[29/34] w-full overflow-hidden border border-black/8 bg-[#f5f7fa]"
                  id={image.id}
                >
                  <Image
                    src={image.url}
                    priority={index <= 2}
                    loading={index <= 2 ? undefined : "lazy"}
                    className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    alt={`Product image ${index + 1}`}
                    fill
                    sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  />
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between border border-white/20 bg-black/65 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span>Tap to expand</span>
                    <span>Zoom view</span>
                  </div>
                </Container>
              </button>
            )
          })}
        </div>
      </div>

      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[90]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 small:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-6xl overflow-hidden border border-white/10 bg-[#050505] text-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 small:px-6">
                    <div>
                      <Dialog.Title className="text-sm font-semibold uppercase tracking-[0.24em] text-white/75">
                        Product Preview
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-white/60">
                        Image {activeIndex + 1} of {galleryImages.length}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsZoomed((current) => !current)}
                        className="border border-white/15 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:border-white/35 hover:bg-white/10"
                      >
                        {isZoomed ? "Reset zoom" : "Zoom in"}
                      </button>
                      <button
                        type="button"
                        onClick={close}
                        className="border border-white/15 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:border-white/35 hover:bg-white/10"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[112px_minmax(0,1fr)]">
                    {galleryImages.length > 1 ? (
                      <div className="hidden max-h-[78vh] overflow-y-auto border-r border-white/10 bg-white/5 p-3 lg:flex lg:flex-col lg:gap-3">
                        {galleryImages.map((image, index) => (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => goToImage(index)}
                            className={`relative aspect-[3/4] overflow-hidden border transition-colors ${
                              index === activeIndex
                                ? "border-white/80"
                                : "border-white/10 hover:border-white/35"
                            }`}
                          >
                            <Image
                              src={image.url}
                              alt={`Thumbnail ${index + 1}`}
                              fill
                              className="object-cover"
                              loading="lazy"
                              sizes="112px"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="relative flex min-h-[70vh] items-center justify-center bg-[#0a0a0a]">
                      {activeImage ? (
                        <div
                          className={`relative h-[70vh] w-full overflow-auto px-4 py-6 small:px-8 ${
                            isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                          }`}
                          onClick={() => setIsZoomed((current) => !current)}
                        >
                          <div
                            className={`relative mx-auto h-full transition-transform duration-300 ${
                              isZoomed ? "scale-[1.85]" : "scale-100"
                            }`}
                          >
                            <Image
                              src={activeImage.url}
                              alt={`Expanded product image ${activeIndex + 1}`}
                              fill
                              className="object-contain"
                              sizes="100vw"
                            />
                          </div>
                        </div>
                      ) : null}

                      {galleryImages.length > 1 ? (
                        <>
                          <button
                            type="button"
                            onClick={goToPrevious}
                            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 border border-white/15 bg-black/45 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-black/65"
                            aria-label="View previous image"
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={goToNext}
                            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 border border-white/15 bg-black/45 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-black/65"
                            aria-label="View next image"
                          >
                            Next
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {galleryImages.length > 1 ? (
                    <div className="flex items-center gap-3 overflow-x-auto border-t border-white/10 px-4 py-4 lg:hidden">
                      {galleryImages.map((image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => goToImage(index)}
                          className={`relative h-20 min-w-16 overflow-hidden border transition-colors ${
                            index === activeIndex
                              ? "border-white/80"
                              : "border-white/10 hover:border-white/35"
                          }`}
                        >
                          <Image
                            src={image.url}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            loading="lazy"
                            sizes="96px"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default ImageGallery
