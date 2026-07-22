"use client"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useMemo } from "react"
import IpBadgeIcon from "@/components/ip-badge-icon"
import Socials, { SOCIAL_TYPE } from "@/components/socials"
import SocialsList from "@/components/socials-list"
import { useIpManageDialog } from "@/context/ip-manage-dialog-context"
import { useTokenMetrics } from "@/context/token-metrics-context"
import { formatNumber } from "@/lib/number"
import { Ip } from "@/types/ip"
import { Remix } from "@/types/remix"
import ManagementTable from "./management-table"
import Image from "../../image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog"

const IpManageDialog = ({ ip, remixes }: { ip: Ip; remixes: Remix[] }) => {
  const { isOpen, openDialog, closeDialog } = useIpManageDialog()
  const metrics = useTokenMetrics()

  const totalEarned = useMemo(() => {
    return remixes.reduce((acc, remix) => {
      const token = metrics.get(remix.token_address.toLowerCase())
      return acc + parseInt(token?.net_in_to_owner_vault || "0") * Number(token?.price_usd || "0")
    }, 0)
  }, [metrics, remixes])

  const totalClaimed = useMemo(() => {
    return remixes.reduce((acc, remix) => {
      const token = metrics.get(remix.token_address.toLowerCase())
      return acc + parseInt(token?.net_out_from_owner_vault || "0") * Number(token?.price_usd || "0")
    }, 0)
  }, [metrics, remixes])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? openDialog() : closeDialog())}>
      <DialogContent className="w-full max-w-(--breakpoint-xl)">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Manage your IP</DialogTitle>
            <DialogDescription>Portfolio value</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          <div className="mb-4 flex justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image
                src={ip.image.startsWith("https") ? ip.image : `/images/ip/${ip.image}`}
                alt="ip-image"
                width={110}
                height={110}
                className="aspect-square h-full w-full object-cover md:h-[110px] md:w-[110px]"
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-3xl">{ip.title}</p>
                  <IpBadgeIcon ip={ip} size={24} />
                </div>
                <p className="mb-4 flex items-center gap-1">
                  <Socials type={ip.owner_account_type as SOCIAL_TYPE} size={16} />@{ip.owner_account}
                </p>
                <SocialsList socials={ip.socials} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="space-y-4">
                <p className="text-[#909090]">Fees Claimed</p>
                <div className="border-neutral-600 bg-neutral-2000 flex h-16 w-[135px] items-center justify-center border-t-2">
                  ${formatNumber(totalClaimed, 4, true)}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[#909090]">Fees Earned</p>
                <div className="border-neutral-600 bg-neutral-2000 flex h-16 w-[135px] items-center justify-center border-t-2">
                  ${formatNumber(totalEarned, 4, true)}
                </div>
              </div>
            </div>
          </div>
          <ManagementTable remixes={remixes} dialogOpen={isOpen} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default IpManageDialog
