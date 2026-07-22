import { Skeleton } from "@/components/ui/skeleton"

const ExploreLoading = () => {
  return (
    <div className="relative mt-14 w-full md:mt-0">
      <div className="relative md:mx-[-20rem] md:mb-20">
        <div className="relative mx-auto flex h-auto w-full max-w-full items-center justify-center px-4 py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="flex w-[440px] flex-col gap-3 rounded-[16px] border p-2">
            <div className="flex gap-3">
              <Skeleton className="h-[100px] w-[100px]" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-[20px] w-[100px]" />
                <Skeleton className="h-[16px] w-[50%]" />
                <Skeleton className="h-[46px] w-full" />
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="3xl:grid-cols-4 grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 24 }, (_, index) => (
          <div className="flex flex-col gap-2 rounded-[16px] border p-2" key={index}>
            <div className="flex gap-3">
              <Skeleton className="h-[100px] w-[100px]" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-[20px] w-[100px]" />
                <Skeleton className="h-[16px] w-[50%]" />
                <Skeleton className="h-[46px] w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExploreLoading
