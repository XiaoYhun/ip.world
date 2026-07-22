"use client"

import dayjs from "dayjs"
import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import ListPagination from "@/components/list-pagination"
import SocialsList from "@/components/socials-list"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import VirtualizedTable from "@/components/ui/virtualized/virtualized-table"
import { formatNumberWithSuffix } from "@/lib/number"
import { truncateAddress } from "@/lib/strings"
import { Referral } from "@/types/referral"

interface ReferralTableProps {
  referrals: Referral[]
  totalPages: number
  currentPage: number
}
export default function ReferralTable({ referrals, totalPages, currentPage }: ReferralTableProps) {
  const renderItem = (referral: Referral) => {
    return (
      <>
        <TableCell className="!py-4">{referral.rank}</TableCell>
        <TableCell className="!py-4">
          <div className="flex h-9 items-center justify-start gap-2">
            <Image
              src={referral.avatar_url || defaultUserImage}
              alt={"user-image"}
              className="aspect-square h-9 w-9 rounded-full object-cover"
              width={36}
              height={36}
            />
            <div className="flex min-w-[7.5rem] flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="max-w-[4.1875rem] truncate lg:max-w-[12.5rem]">@{referral.username}</div>
                {referral.socials && <SocialsList className="hidden !gap-1 lg:flex" socials={referral.socials} />}
              </div>
              <div className="hidden truncate text-sm font-normal text-neutral-300 lg:flex">
                {truncateAddress(referral.referred_wallet_address)}
              </div>
              <div className="flex truncate text-sm font-normal text-neutral-300 lg:hidden">
                {truncateAddress(referral.referred_wallet_address, 5)}
              </div>
              {referral.socials && <SocialsList className="flex !gap-1 lg:hidden" socials={referral.socials} />}
            </div>
          </div>
        </TableCell>
        <TableCell className="!py-4">{formatNumberWithSuffix(referral.total_points)} pts</TableCell>
        <TableCell className="!py-4">{dayjs(referral.referral_date).format("MM/DD/YYYY")}</TableCell>
        <TableCell className="!py-4 text-right">{referral.points_earned} pts</TableCell>
      </>
    )
  }

  return (
    <div className="virtualized w-full">
      <VirtualizedTable
        data={referrals}
        renderItem={renderItem}
        header={
          <TableRow className="bg-black!">
            <TableHead className="text-left text-[0.8125rem] text-neutral-300 uppercase">RANK</TableHead>
            <TableHead className="text-left text-[0.8125rem] text-neutral-300 uppercase">USER</TableHead>
            <TableHead className="text-left text-[0.8125rem] text-neutral-300 uppercase">POINTS</TableHead>
            <TableHead className="text-left text-[0.8125rem] text-neutral-300 uppercase">REFERRAL DATE</TableHead>
            <TableHead className="text-right text-[0.8125rem] text-neutral-300 uppercase">POINTS YOU EARNED</TableHead>
          </TableRow>
        }
      />
      {totalPages > 1 && (
        <ListPagination currentPage={currentPage} totalPages={totalPages} pageParamsName={"referrals_page"} />
      )}
    </div>
  )
}
