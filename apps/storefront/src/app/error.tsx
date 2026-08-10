"use client"

import { useEffect } from "react"
import Link from "next/link"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
        Storefront error
      </p>
      <h1 className="text-3xl font-semibold text-black">Something went wrong.</h1>
      <p className="max-w-xl text-sm leading-7 text-black/62">
        We could not load this page right now. Please try again, or head back to
        the home page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/85"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:border-black/25"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
