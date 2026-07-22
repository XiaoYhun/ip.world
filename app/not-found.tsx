import { Search } from "lucide-react"
import ErrorAction from "@/components/error-boundary/error-action"

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-[10px] border p-6 text-center shadow-lg">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
            <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <h1 className="text-foreground mb-2 text-xl font-semibold">Page Not Found</h1>

        <p className="text-muted-foreground mb-6 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <ErrorAction />
      </div>
    </div>
  )
}
