import { Info } from "lucide-react"

/**
 * Shown when the homepage is rendering fixtures from constants/homepageMocks
 * instead of live API data. The shelves display market caps, prices and holder
 * counts, so visitors need to be told plainly that those numbers are invented.
 */
export default function DemoDataNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-200/85 sm:items-center sm:text-sm">
      <Info size={15} className="mt-0.5 shrink-0 text-amber-400/80 sm:mt-0" />
      <p>
        <span className="font-medium text-amber-200">Demo data.</span> This deployment can&apos;t reach its backend API, so
        the coins, prices, market caps and holder counts below are fabricated sample values — not real market data.
      </p>
    </div>
  )
}
