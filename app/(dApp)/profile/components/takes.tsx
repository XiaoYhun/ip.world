import { ListResponse } from "@/types/response"
import { Take } from "@/types/take"
import InfiniteScrollTake from "./infinite-scroll-take"

export default function CreatedRemix({
  address,
  takesResponse,
}: {
  address: string
  takesResponse: ListResponse<Take>
}) {
  return (
    <InfiniteScrollTake address={address} initialTakes={takesResponse?.results || []} total={takesResponse?.total} />
  )
}
