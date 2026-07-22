import { SadFace } from "../icons/sad-face"

const EmptyState = () => {
  return (
    <div className="flex w-full flex-col items-center justify-center py-32">
      <div className="text-neutral-200 mb-6">
        <SadFace />
      </div>
      <h2 className="text-neutral-200 mb-4 text-2xl font-medium">No results found</h2>
      <p className="max-w-[600px] text-center text-lg text-neutral-600">
        We couldn&apos;t find any matches for your search. Please try <br /> a different query or browse our categories.
      </p>
    </div>
  )
}

export default EmptyState
