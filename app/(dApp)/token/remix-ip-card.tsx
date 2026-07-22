import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { archivoBlack } from "@/app/fonts/fonts"
import Image from "@/components/image"
import IpBadgeIcon from "@/components/ip-badge-icon"
import { Button } from "@/components/ui/button"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { Remix } from "@/types/remix"
import * as stars from "@/components/stars"
import ViralityScore from "@/components/virality-score"
import Link from "next/link"

const RemixIpCard = ({ remix, disablePopup = false }: { remix: Remix; disablePopup?: boolean }) => {
  const router = useRouter()
  const isMobile = useIsMobileView()
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  const handleTitleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (isMobile) {
      setIsPopupOpen(!isPopupOpen)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        isPopupOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        titleRef.current &&
        !titleRef.current.contains(event.target as Node)
      ) {
        setIsPopupOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobile, isPopupOpen])

  return (
    <div className="group relative z-2 cursor-pointer">
      <div ref={titleRef} className="max-w-[12.5rem] truncate text-sm" onClick={handleTitleClick}>
        {remix.ip?.title}
      </div>
      {!disablePopup && (
        <div
          ref={popupRef}
          className={cn(
            "pointer-events-none absolute right-0 bottom-[-15rem] z-[1000] flex scale-95 flex-col items-end pt-2 transition-all duration-300 ease-out sm:right-[-15rem]",
            isMobile
              ? isPopupOpen
                ? "pointer-events-auto scale-100 opacity-100"
                : "opacity-0"
              : "opacity-0 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100"
          )}
        >
          <div className="w-[23.25rem] rounded-[12px] border border-neutral-400 bg-black shadow-lg sm:w-[23.25rem]">
            <div
              onClick={() => router.push(`/ip/${remix?.ip?.handle}`)}
              className="flex items-start gap-2 border-b border-neutral-600 p-2"
            >
              <Image
                src={remix.ip?.image || ""}
                alt={"main-image"}
                className="aspect-square size-18 rounded-[10px] object-cover"
                width={74}
                height={74}
              />
              <div className="flex w-full flex-row items-start gap-2">
                <div className="mt-2 flex flex-col items-start gap-0.5">
                  <div className={cn(archivoBlack.className, "text-md flex items-center gap-1")}>
                    <span className="max-w-[12rem] truncate">{remix.ip?.title}</span>
                    <IpBadgeIcon ip={remix.ip as Ip} tooltip={false} />
                  </div>
                  {remix.ip?.alias && <div className="mt-1 text-sm font-medium">@{remix.ip?.alias}</div>}
                  <div className="mt-2">
                    <stars.Stars rating={remix?.ip?.take_info?.average_rating || 0} />
                  </div>
                </div>
                {remix?.ip && (
                  <div className="ms-auto">
                    <ViralityScore ip={remix?.ip} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 p-2">
              <div className="text-xs font-medium">Top Tokens</div>
              <div className="flex gap-1">
                {remix.ip?.remixes?.slice(0, 5).map((token, i) => (
                  <Link href={`/token/${token.token_address}`} key={i}>
                    <motion.div whileHover={{ scale: 1.2 }} className="cursor-pointer">
                      <Image
                        src={token.image}
                        alt={"active"}
                        className="aspect-square h-[4.0625rem] w-[4.0625rem] rounded-[10px] object-cover"
                        width={65}
                        height={65}
                      />
                    </motion.div>
                  </Link>
                ))}
                {!remix.ip?.remixes && (
                  <div className="flex h-[4.0625rem] w-full items-center justify-center text-neutral-300">
                    no token yet.
                  </div>
                )}
              </div>
              <Button
                variant="primary"
                onClick={(e: { stopPropagation: () => void }) => {
                  e.stopPropagation()
                  router.push(`/create/ip/${remix.ip?.handle}`)
                }}
                className="h-9 w-full cursor-pointer"
              >
                Remix
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RemixIpCard
