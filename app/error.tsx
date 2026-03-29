"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled route error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">
          The dashboard could not be loaded. Please try again.
        </p>
        <Button onClick={reset} className="mt-6 bg-[#8B0000] hover:bg-[#700000]">
          Try again
        </Button>
      </div>
    </div>
  )
}
