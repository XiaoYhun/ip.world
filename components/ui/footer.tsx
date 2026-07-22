"use client"
import Link from "next/link"
// import { useAccount } from "wagmi"
import BridgeDialog from "@/components/dialog/bridge-dialog"
import { env } from "@/config"
import { useIpPrice } from "@/context/token-metrics-context"
import { formatNumber } from "@/lib/number"
import { Separator } from "./separator"
import { Discord, Ip, Tiktok, Twitter } from "../icons"

const Footer = () => {
  // const { isConnected } = useAccount()
  const ipPrice = useIpPrice()

  return (
    <footer className="fixed bottom-0 z-50 hidden w-[calc(100vw-57px)] items-center justify-between border-t bg-[#111111] px-8 py-3 md:flex">
      <div className="flex gap-4">
        <div className="flex items-center justify-center gap-1">
          <div className="flex h-[0.4375rem] w-[0.4375rem] items-center justify-center rounded-full bg-[#107740] px-0.5">
            <div className="h-[0.25rem] w-[0.25rem] rounded-full bg-[#08C25F]"></div>
          </div>
          <div className="text-xs font-medium">Connected</div>
        </div>
        {/* {isConnected ? (
          <div className="flex items-center justify-center gap-1">
            <div className="flex h-[0.4375rem] w-[0.4375rem] items-center justify-center rounded-full bg-[#107740] px-0.5">
              <div className="h-[0.25rem] w-[0.25rem] rounded-full bg-[#08C25F]"></div>
            </div>
            <div className="text-xs font-medium">Connected</div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <div className="flex h-[0.4375rem] w-[0.4375rem] items-center justify-center rounded-full bg-[#771010] px-0.5">
              <div className="bg-red h-[0.25rem] w-[0.25rem] rounded-full"></div>
            </div>
            <div className="text-xs font-medium">Disconnected</div>
          </div>
        )} */}
        <div className="flex items-center justify-center gap-1 text-xs font-medium">
          <Ip size={10} />
          <div>${formatNumber(ipPrice, 2)}</div>
        </div>
        {/* <BridgeDialog
          trigger={<div className="cursor-pointer text-xs font-normal text-neutral-300 hover:text-white">Bridge</div>}
        /> */}
      </div>
      <div className="flex items-center gap-4 text-xs text-neutral-300">
        <Link href={"https://tiktok.com/@ipdotworld"} target="_blank" className="text-white transition-colors">
          <Tiktok size={14} />
        </Link>
        <Link href={env.NEXT_PUBLIC_TWITTER_URL} target="_blank" className="text-white transition-colors">
          <Twitter size={12} />
        </Link>
        <Link href={"http://discord.gg/ipworld"} target="_blank" className="text-white transition-colors">
          <Discord size={16} />
        </Link>

        <Separator orientation="vertical" className="h-3.5! bg-neutral-300" />
        {/* <Link href={"https://docs.ip.world/"} target="_blank" className="transition-colors hover:text-white">
          Docs
        </Link> */}
        <Link href="/terms-of-service" className="transition-colors hover:text-white" target="_blank">
          Terms
        </Link>
        <Link href="/privacy-policy" className="transition-colors hover:text-white" target="_blank">
          Policy
        </Link>
      </div>
    </footer>
  )
}

export default Footer
