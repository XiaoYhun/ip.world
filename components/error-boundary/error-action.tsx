"use client"

import { Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { errorReporter } from "@/lib/error-reporting"

interface ErrorActionProps {
  error?: Error & { digest?: string }
  reset?: () => void
}

export default function ErrorAction({ error, reset }: ErrorActionProps) {
  useEffect(() => {
    if (error) {
      errorReporter.reportError(error, {
        component: "GlobalError",
        action: "GlobalError",
        severity: "critical",
        digest: error?.digest,
      })
    }
  }, [error])

  const handlerReset = () => {
    if (reset) {
      reset()
    }

    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
      <Button onClick={handlerReset} variant="outline" className="flex items-center gap-2">
        <div className="flex flex-row gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </div>
      </Button>

      <Button onClick={() => (window.location.href = "/")} className="flex items-center gap-2">
        <Link href="/" className="flex flex-row gap-2">
          <Home className="h-4 w-4" />
          Go Home
        </Link>
      </Button>
    </div>
  )
}
