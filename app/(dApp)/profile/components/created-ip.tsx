import { Ip } from "@/types/ip"
import { ListResponse } from "@/types/response"
import InfiniteScrollIp from "./infinite-scroll-ip"

export default function CreatedRemix({ address, ipsResponse }: { address: string; ipsResponse: ListResponse<Ip> }) {
  return <InfiniteScrollIp address={address} initialIps={ipsResponse?.results || []} total={ipsResponse?.total} />
}
