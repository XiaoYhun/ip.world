import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { isAddress } from "viem"
import { useProfile } from "@/hooks/use-profile"
import Copy from "../copy"
import { Referral } from "../icons/referral"

export default function ReferralCode() {
  const isLoggedIn = useIsLoggedIn()
  const router = useRouter()
  const { user } = useProfile()
  const { setShowAuthFlow } = useDynamicContext()

  return (
    <div
      key={`referral-code`}
      className={
        "bg-gradient-grey ease-out-quint hover:bg-neutral-600 relative flex h-7.5 w-full flex-nowrap items-center gap-2 rounded-[6px] p-[6px] no-underline transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40"
      }
      aria-current="page"
    >
      <div className="ms-1 flex items-center justify-center">
        <Referral size={14} />
      </div>
      <div className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden opacity-100 transition-opacity duration-1000 group-hover:opacity-100 md:opacity-0">
        <div className="relative flex w-full flex-col items-start justify-center gap-4 rounded-[12px] p-2 group-hover:flex md:hidden">
          {isLoggedIn && user?.username && !isAddress(user?.username) && (
            <div className="flex w-full text-sm font-medium text-white">
              <span className="max-w-[6.25rem] truncate text-white/70">{user?.referral_code}</span>
              <span className="ms-auto text-neutral-300 transition-all hover:text-white">
                <Copy copy={`https://ip.world/?ref=${user?.referral_code || ""}`} size={14} />
              </span>
            </div>
          )}
          {isLoggedIn && (!user?.username || isAddress(user?.username)) && (
            <div
              onClick={() => router.push("/settings")}
              className="flex w-full cursor-pointer items-center text-sm font-medium text-neutral-300 transition-all hover:text-white"
            >
              <span className="text-xxs underline">Add username to claim</span>
              <ArrowRight className="ms-auto" size={14} />
            </div>
          )}
          {!isLoggedIn && (
            <div
              onClick={() => setShowAuthFlow(true)}
              className="flex w-full cursor-pointer items-center text-sm font-medium text-neutral-300 transition-all hover:text-white"
            >
              <span className="underline">Login to claim</span>
              <ArrowRight className="ms-auto" size={14} />
            </div>
          )}
        </div>
      </div>
      <div className="bg-rainbow absolute h-full w-full"></div>
    </div>
  )
}
