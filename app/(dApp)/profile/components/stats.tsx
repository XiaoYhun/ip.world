import { formatNumberWithSuffix } from "@/lib/number"
import { UserStats } from "@/types/profile"

export default function Stats({ stats }: { stats: UserStats }) {
  return (
    <div className="mt-4 flex w-full items-start md:gap-5">
      <div className="flex-1 flex-col items-start gap-2">
        <p className="text-neutral-200 text-sm">Value</p>
        <p className="text-3xl font-medium text-white">{formatNumberWithSuffix(stats?.portfolio_value)}</p>
      </div>
      <div className="flex-1 flex-col items-start gap-2">
        <p className="text-neutral-200 text-sm">Remixed</p>
        <p className="text-3xl font-medium text-white">{formatNumberWithSuffix(stats?.remixes_created)}</p>
      </div>
      <div className="flex-1 flex-col items-start gap-2">
        <p className="text-neutral-200 text-sm">Created</p>
        <p className="text-3xl font-medium text-white">{formatNumberWithSuffix(stats?.ips_created)}</p>
      </div>
      <div className="flex-1 flex-col items-start gap-2">
        <p className="text-neutral-200 text-sm">Following</p>
        <p className="text-3xl font-medium text-white">{formatNumberWithSuffix(stats?.favorites_count)}</p>
      </div>
    </div>
  )
}
