import { Skeleton } from "@/components/ui/skeleton"

const IpGridItemSkeleton = () => {
  return (
    <div className="rounded-[1em] border bg-neutral-700 p-[0.5em]">
      {/* Image area with aspect-video */}
      <div className="relative mb-[1em] aspect-video h-auto shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-[0.75em]">
          <Skeleton className="h-full w-full bg-neutral-800" />
          <div className="absolute inset-0 bg-linear-to-t from-neutral-800 to-transparent" />

          {/* Top left category pill skeleton */}
          <div className="absolute top-2 left-2">
            <Skeleton className="h-5 w-16 rounded-full bg-neutral-600" />
          </div>

          {/* Top right virality label skeleton */}
          <div className="absolute top-2 right-2">
            <Skeleton className="h-5 w-12 rounded-full bg-neutral-600" />
          </div>

          {/* Bottom left title and owner skeleton */}
          <div className="absolute bottom-2 left-2">
            <Skeleton className="mb-1 h-5 w-32 bg-neutral-600" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded bg-neutral-600" />
              <Skeleton className="h-3 w-20 bg-neutral-600" />
            </div>
          </div>

          {/* Bottom right remix skeleton */}
          <div className="absolute right-[0.5em] bottom-[0.5em]">
            <Skeleton className="h-[2.5em] w-[5em] rounded-full bg-neutral-600" />
          </div>
        </div>
      </div>

      {/* Stats row below image */}
      <div className="mb-[0.75em] flex justify-between font-mono text-[0.8125em]">
        <div className="flex items-center gap-1">
          <Skeleton className="h-[1.25em] w-[1.25em] rounded bg-neutral-600" />
          <Skeleton className="h-[1em] w-8 bg-neutral-600" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-[1.25em] w-[1.25em] rounded bg-neutral-600" />
          <Skeleton className="h-[1em] w-12 bg-neutral-600" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-[1.25em] w-[1.25em] rounded bg-neutral-600" />
          <Skeleton className="h-[1em] w-8 bg-neutral-600" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-[1.25em] w-[1.25em] rounded bg-neutral-600" />
          <Skeleton className="h-[1em] w-6 bg-neutral-600" />
        </div>
      </div>
    </div>
  )
}

const IpGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <IpGridItemSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    </div>
  )
}

export default IpGridSkeleton
