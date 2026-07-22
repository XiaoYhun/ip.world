import { useMemo } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAccount } from "@/hooks/use-account"
import useGetTokenBalances from "@/hooks/use-get-token-balances"
import { Holding } from "@/types/holding"
import TokenBalanceItem from "./token-balance-item"
import { ScrollArea } from "../ui/scroll-area"

const DEBUG_MULTIPLY_HOLDINGS = false

const TokenBalance = () => {
  const { address } = useAccount()
  const { data: balances } = useGetTokenBalances(address)

  const items = useMemo(() => {
    const source = balances && balances.total ? balances.results : []
    if (DEBUG_MULTIPLY_HOLDINGS && source.length > 0) {
      return Array.from({ length: 25 }, () => source).flat()
    }
    return source
  }, [balances])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 pb-4 text-sm font-medium text-white">
        Tokens {balances.total ? <span className="text-neutral-300">({balances.total})</span> : null}
      </div>

      <div className="relative mt-4 flex-1 overflow-hidden">
        <ScrollArea className="-mx-2 h-full">
          {items.map((holding: Holding, index) => (
            <TokenBalanceItem key={`${holding.token_address}-${index}`} holding={holding} />
          ))}

          {!balances.total && (
            <div className="mt-10 flex flex-col items-center justify-center gap-4">
              <div className="text-sm font-medium text-white">You have no tokens</div>
              <Link className="cursor-pointer" href="/">
                <div className="text-md text-brand flex gap-1 font-medium underline">
                  <div>Explore Tokens</div>
                  <ArrowRight size={14} />
                </div>
              </Link>
            </div>
          )}

          {/* Spacer so the last item scrolls above the fade */}
          {items.length > 0 && <div className="h-20" />}
        </ScrollArea>

        {/* Bottom fade gradient */}
        {items.length > 0 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
        )}
      </div>
    </div>
  )
}

export default TokenBalance
