import {
  Instagram,
  Tiktok,
  Twitter,
  Youtube,
} from "@/components/icons"
import { Remix } from "@/types/remix"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Ip } from "@/types/ip"

export default function SkeletonTokenCard({ token, ip }: { token: Partial<Remix>, ip: Partial<Ip> }) {
  return <div className="rounded-[16px] border bg-transparent w-[410px] h-[260px] overflow-hidden relative backdrop-blur-lg" style={{ boxShadow: "0px 10px 10px 0px rgba(0, 0, 0, 0.4)" }}>
    {token.image ? <Image fill src={token.image} alt={"preview token image"} className="object-cover z-0" /> : <Skeleton className="h-full w-full z-0 absolute opacity-50" />}
    <div className="absolute z-1 w-full h-full bg-linear-to-t from-black/75 via-50% via-transparent to-transparent"></div>

    <div className="relative z-2 h-full flex flex-col justify-between p-3">
      <div>
        {ip ? (
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-[16px] px-1 py-1 w-fit">
            <div className="relative size-[26px] rounded-[8px] overflow-hidden shrink-0">
              {ip.image ? <Image fill src={ip.image || ""} alt={ip.title || ""} className="object-cover" /> : <Skeleton className="h-full w-full z-0 absolute" />}
            </div>
            <span className="text-sm font-medium text-neutral-100 truncate max-w-[100px] px-2 py-[7px] bg-black/40 rounded-[8px]">{ip.title}</span>
          </div>
        ) : (
          <Skeleton className="h-8 w-35 rounded-[16px]!" />
        )}
      </div>
      <div >
        <div className="flex w-full justify-between items-end mb-2">
          <div className="flex flex-col gap-0.5">
            {token.name ? <div className="text-2xl font-archivo font-semibold text-nowrap">{token.name}</div> : <Skeleton className="h-5 w-24" />}
            {token.symbol ? <div className="text-xl font-medium text-nowrap text-white/50 font-mono">${token.symbol}</div> : <Skeleton className="h-4 w-16" />}
          </div>
          <div className="flex gap-0.5">
            {token.socials?.twitter ? <Link href={token.socials.twitter} target="_blank" className="flex size-5 items-center justify-center rounded-[4px] p-1 duration-200 hover:bg-white/10 text-neutral-200 hover:text-white"> <Twitter size={16} /> </Link> : <></>}
            {token.socials?.tiktok ? <Link href={token.socials.tiktok} target="_blank" className="flex size-5 items-center justify-center rounded-[4px] p-1 duration-200 hover:bg-white/10 text-neutral-200 hover:text-white"> <Tiktok size={16} /> </Link> : <></>}
            {token.socials?.instagram ? <Link href={token.socials.instagram} target="_blank" className="flex size-5 items-center justify-center rounded-[4px] p-1 duration-200 hover:bg-white/10 text-neutral-200 hover:text-white"> <Instagram size={16} /> </Link> : <></>}
            {token.socials?.youtube ? <Link href={token.socials.youtube} target="_blank" className="flex size-5 items-center justify-center rounded-[4px] p-1 duration-200 hover:bg-white/10 text-neutral-200 hover:text-white"> <Youtube size={16} /> </Link> : <></>}
          </div>
        </div>
        <div>{token.description ? <div className="text-sm text-neutral-100/70">{token.description}</div> : <Skeleton className="h-4 w-4/5" />}</div>
      </div>
    </div>
  </div>
}
