import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "404",
  description: "Something went wrong",
}

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold text-black">Page not found</h1>
      <p className="max-w-xl text-sm leading-7 text-black/62">
        The cart you tried to access does not exist. Clear your cookies and try
        again.
      </p>
      <Link
        href="/"
        className="rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:border-black/25"
      >
        Go to frontpage
      </Link>
    </div>
  )
}
