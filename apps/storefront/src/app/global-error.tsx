"use client"

import Link from "next/link"

type GlobalErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  console.error(error)

  return (
    <html lang="en">
      <body className="bg-[#f5f9ff] text-black">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
            Glabee
          </p>
          <h1 className="text-3xl font-semibold">A page error occurred.</h1>
          <p className="max-w-xl text-sm leading-7 text-black/62">
            The storefront hit an unexpected issue. You can retry the page or go
            back to the catalog.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/85"
            >
              Retry
            </button>
            <Link
              href="/"
              className="rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:border-black/25"
            >
              Return home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
