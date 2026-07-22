import { Skeleton } from "@/components/ui/skeleton"

export default function HeroSkeleton() {
  return (
    <>
      {/* Mobile section skeleton - matches EarnedRewards layout */}
      <div className="relative flex h-64 flex-col px-4 md:hidden">
        <div className="mt-4 flex justify-between">
          <Skeleton className="h-8 w-30" />
          <Skeleton className="h-8 w-36" />
        </div>

        <div className="absolute top-20 w-full">
          <div className="mr-8 mb-8 rounded-[10px] bg-neutral-600 p-4">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-[6px]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-[6px]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop hero skeleton - matches HeroItem dimensions */}
      <section className="relative mt-[-4rem] hidden md:block">
        <div className="relative flex h-[33.5625rem] w-full overflow-hidden">
          {/* Left content area - matches actual hero layout */}
          <div className="flex w-full flex-col gap-2 px-[4.125rem] pt-[9.8125rem]">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Main title */}
            <Skeleton className="mb-2 h-8 w-80" />

            {/* Description */}
            <Skeleton className="mb-4 h-6 w-[29rem]" />

            {/* Buttons */}
            <div className="my-4 flex items-center gap-6">
              <Skeleton className="h-[2.375rem] w-[7.8125rem] rounded-[6px]" />
              <Skeleton className="h-6 w-28" />
            </div>

            {/* Earned rewards section */}
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>

          {/* Right trending section - matches TrendingTokens */}
          <div className="absolute top-0 right-0 flex h-full flex-col justify-end">
            <div className="mr-8 mb-8 w-80 rounded-[10px] bg-neutral-600 p-4">
              <Skeleton className="mb-4 h-6 w-32" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-[6px]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-[6px]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute inset-0 mt-auto h-[2rem] bg-gradient-to-b from-transparent to-black" />
        </div>
      </section>
    </>
  )
}
