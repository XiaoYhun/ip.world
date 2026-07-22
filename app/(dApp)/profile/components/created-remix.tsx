import { Remix } from "@/types/remix"
import { ListResponse } from "@/types/response"
import InfiniteScrollRemix from "./infinite-scroll-remix"

export default function CreatedRemix({
  address,
  remixesResponse,
  view = "grid",
}: {
  address: string
  remixesResponse: ListResponse<Remix>
  view?: "grid" | "list"
}) {
  return (
    <InfiniteScrollRemix
      address={address}
      initialRemixes={remixesResponse?.results || []}
      total={remixesResponse?.total}
      view={view}
    />
  )
}
