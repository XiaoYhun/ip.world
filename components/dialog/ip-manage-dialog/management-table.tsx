import { RefreshCcw } from "lucide-react"
import { useCallback, useEffect } from "react"
import { Address } from "viem"
import { refreshMetrics } from "@/actions/metrics/refresh"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTokenMetrics } from "@/context/token-metrics-context"
import useGetIpRewardsData, { RewardDataType } from "@/hooks/use-get-ip-rewards-data"
import { getAuthToken } from "@/lib/dynamic"
import { TokenMetrics } from "@/lib/schema/token-metrics-schema"
import { Remix } from "@/types/remix"
import ManagementTableItem from "./management-table-item"

const ManagementTable = ({ remixes, dialogOpen }: { remixes: Remix[]; dialogOpen: boolean }) => {
  const metrics = useTokenMetrics()

  const {
    data: rewardsData,
    refetch,
    isLoading,
  } = useGetIpRewardsData(remixes.map((remix) => remix.token_address as Address))

  const reload = useCallback(() => {
    refetch()
    refreshMetrics(
      { tokenAddresses: remixes.map((remix) => remix.token_address.toLowerCase() as Address) },
      getAuthToken()
    )
  }, [refetch, remixes])

  useEffect(() => {
    if (dialogOpen) {
      reload()
    }
  }, [dialogOpen, reload])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Earned</TableHead>
          <TableHead>Claimed</TableHead>
          <TableHead>Vested</TableHead>
          <TableHead>Balance</TableHead>
          <TableHead>
            <span className="flex cursor-pointer items-center justify-end gap-2">
              <RefreshCcw className="text-neutral-300 hover:text-white" onClick={reload} />
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {remixes.length ? (
          remixes.map((remix) => (
            <ManagementTableItem
              key={remix.token_address}
              remix={remix}
              tokenMetric={metrics.get(remix.token_address.toLowerCase() as Address) as TokenMetrics}
              rewards={rewardsData.get(remix.token_address as Address) as RewardDataType}
              reload={reload}
              isLoading={isLoading}
            />
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-[13px] w-full py-8 text-center">
              No token found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default ManagementTable
