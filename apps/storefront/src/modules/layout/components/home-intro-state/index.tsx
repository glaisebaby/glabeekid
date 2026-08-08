"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const INTRO_COMPLETE_KEY = "glabeekid-hero-intro-complete"

const isHomePath = (pathname: string) => {
  return pathname === "/" || /^\/[a-z]{2}(?:-[A-Z]{2})?$/.test(pathname)
}

const syncIntroState = (pathname: string) => {
  const root = document.documentElement

  if (!isHomePath(pathname)) {
    root.dataset.homeIntro = "complete"
    return
  }

  root.dataset.homeIntro = "pending"
}

export default function HomeIntroState() {
  const pathname = usePathname()

  useEffect(() => {
    syncIntroState(pathname)

    const handleComplete = () => {
      document.documentElement.dataset.homeIntro = "complete"
    }

    window.addEventListener("glabeekid:intro-complete", handleComplete)

    return () => {
      window.removeEventListener("glabeekid:intro-complete", handleComplete)
    }
  }, [pathname])

  return null
}
