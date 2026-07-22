"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import TotalUgcPayoutsCard, { TotalUgcPayoutsCardProps } from "./TotalUgcPayoutsCard"

type HolderPayoutHistoryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
} & Pick<TotalUgcPayoutsCardProps, "totalPayoutUsd" | "payouts">

export default function HolderPayoutHistoryModal({
  open,
  onOpenChange,
  totalPayoutUsd,
  payouts,
}: HolderPayoutHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        className="w-[360px] max-w-[90vw] border-none bg-transparent p-0 shadow-none"
      >
        <TotalUgcPayoutsCard
          title="Total Holder Payouts"
          totalPayoutUsd={totalPayoutUsd}
          payouts={payouts}
          onClose={() => onOpenChange(false)}
          className="w-full"
        />
      </DialogContent>
    </Dialog>
  )
}

