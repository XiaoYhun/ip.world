import {
  ArrowEnter,
  Clock,
  Comment,
  Community,
  Crown,
  Instagram,
  TelegramAlt,
  Tiktok,
  Twitter,
  User,
  Website,
  Youtube,
} from "@/components/icons"
import EndorsementIndicator from "@/components/remixes/endorsement-indicator"
import Timer from "@/components/timer"
import { formatNumber, formatNumberWithSuffix, formatNumberWithSuperscriptZeros } from "@/lib/number"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import Image from "next/image"
import Link from "next/link"

export default function TokenCard({ token }: { token: Remix }) {
  return (
    <div className="relative flex min-w-[400px] cursor-pointer flex-col overflow-hidden rounded-[16px] border bg-neutral-800 transition-all duration-200 hover:scale-105">
      <div className="flex w-full flex-col gap-2 p-3">
        <div className="flex w-full gap-2">
          <div className="relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[8px]">
            <Image src={token.image} alt={token.name} className="object-cover" fill />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex w-full justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-end gap-1">
                  <EndorsementIndicator remix={token} iconOnly />
                  <div className="text-base font-medium text-nowrap">{token.name}</div>
                  <div className="text-sm font-bold text-nowrap text-neutral-200">${token.symbol}</div>
                </div>
                <div className="mb-1 flex w-full items-center">
                  <div className="me-2 text-neutral-300">
                    <ArrowEnter width={14} height={11} />
                  </div>
                  {token?.ip?.type === "creator" ? (
                    <span className="me-1 text-purple-200">
                      <Crown width={16} height={15} />
                    </span>
                  ) : (
                    <span className="me-1 text-purple-200">
                      <Community width={18} height={15} />
                    </span>
                  )}
                  <div className="truncate text-sm font-medium text-white">{token?.ip?.title}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="font-mono">
                  <span className="me-1 text-[10px] font-medium text-neutral-300">MC</span>
                  <span className="text-xl !leading-[18px] font-medium text-white">
                    ${formatNumberWithSuffix(token.market_cap || 0, 2)}
                  </span>
                </div>
                <div className="font-mono">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      token.price_usd_change >= 0 ? "text-green-neon" : "text-pink-neon"
                    )}
                  >
                    {formatNumber(token.price_usd_change || 0)}%
                  </span>
                  <span className="ms-1 text-[11px] font-medium text-neutral-400">24hr</span>
                </div>
              </div>
            </div>
            <div className="flex w-full justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-medium text-neutral-300">VOL</div>
                <div className="font-mono text-xs text-nowrap text-white">
                  ${formatNumberWithSuffix(token.total_volume_usd || 0)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-medium text-neutral-300">LIQ</div>
                <div className="font-mono text-xs text-nowrap text-white">
                  ${formatNumberWithSuffix(token.pool_size || 0)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-medium text-neutral-300">PRICE</div>
                <div className="font-mono text-xs text-nowrap text-white">
                  ${formatNumberWithSuperscriptZeros(token.price_usd || 0)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-medium text-neutral-300">TX</div>
                <div className="flex items-center gap-[6px] font-mono text-xs text-nowrap text-white">
                  {formatNumberWithSuffix(token.daily_tx_count || 0, 1)}
                  <div className="flex w-[60px] items-center">
                    <div className="bg-green-neon h-[2px] w-[20px] rounded-full"></div>
                    <div className="bg-pink-neon h-[2px] w-[40px] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex w-full gap-2">
            <div className="flex w-[78px] shrink-0 flex-col gap-0.5">
              <div className="relative h-[4px] w-full overflow-hidden rounded-full bg-neutral-600">
                <div
                  className="h-full w-full rounded-full bg-purple-200"
                  style={{ width: `${token.graduation_progress || 0}%` }}
                />
              </div>
              <div className="font-mono text-xs text-purple-200">{token.graduation_progress || 0}%</div>
            </div>
            <div className="flex w-full flex-1 justify-between gap-2">
              <div className="flex gap-1">
                {token.socials?.telegram && (
                  <Link
                    href={token.socials?.telegram}
                    className="flex size-5 items-center justify-center rounded-[4px] bg-neutral-700 p-1 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <TelegramAlt size={8} />
                  </Link>
                )}
                {token.socials?.twitter && (
                  <Link
                    href={token.socials?.twitter}
                    className="flex size-5 items-center justify-center rounded-[4px] bg-neutral-700 p-1 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Twitter size={8} />
                  </Link>
                )}
                {token.socials?.instagram && (
                  <Link
                    href={token.socials?.twitter}
                    className="flex size-5 items-center justify-center rounded-[4px] bg-neutral-700 p-1 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Instagram size={8} />
                  </Link>
                )}
                {token.socials?.tiktok && (
                  <Link
                    href={token.socials?.tiktok}
                    className="flex size-5 items-center justify-center rounded-[4px] bg-neutral-700 p-1 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Tiktok size={8} />
                  </Link>
                )}
                {token.socials?.youtube && (
                  <Link
                    href={token.socials?.youtube}
                    className="flex size-5 items-center justify-center rounded-[4px] bg-neutral-700 p-1 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Youtube size={8} />
                  </Link>
                )}
                {token.socials?.website && (
                  <Link
                    href={token.socials?.website}
                    className="flex size-5 items-center justify-center rounded-[4px] bg-neutral-700 p-1 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Website size={8} />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1 text-nowrap">
                <div className="flex items-center justify-center gap-1 text-xs leading-[100%] font-normal text-neutral-300">
                  <Comment />
                  <div>{token.number_of_comments ? token.number_of_comments : "0"}</div>
                </div>
                <div className="h-[0.7969rem] w-[0.0313rem] bg-neutral-600"></div>
                <div className="flex items-center justify-center gap-1 text-xs leading-[100%] font-normal text-nowrap text-neutral-300">
                  <span className="mt-[-0.0625rem]">
                    <Clock />
                  </span>
                  {token.created_at ? <Timer startTime={token.created_at} /> : "--"}
                </div>
                <div className="h-[0.7969rem] w-[0.0313rem] bg-neutral-600"></div>
                <div className="flex items-center justify-center gap-1 text-xs leading-[100%] font-normal text-neutral-300">
                  <User />
                  <div>{formatNumberWithSuffix(token.number_of_holders)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
