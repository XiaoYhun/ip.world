import { useSocialAccounts } from "@dynamic-labs/sdk-react-core"
import { ProviderEnum } from "@dynamic-labs/types"
import { useAccount } from "@/hooks/use-account"
import { useProfile } from "@/hooks/use-profile"
import { extractTwitterUsername } from "@/lib/username-extractors"
import { Ip, IP_STATUS } from "@/types/ip"

export const useIsIpOwner = (ip?: Ip | null) => {
  const { address } = useAccount()
  const { user } = useProfile()
  const { getLinkedAccountInformation } = useSocialAccounts()

  if (!ip) {
    return {
      isIpOwner: false,
      isUserAlreadyOwner: false,
      isUserTheOwner: false,
      userAddress: address || user?.wallet_address,
    }
  }

  const xAccount = getLinkedAccountInformation(ProviderEnum.Twitter)
  const userAddress = address || user?.wallet_address

  const hasTwitterConnected = !!xAccount?.username

  const isUserTwitterOwner =
    hasTwitterConnected &&
    extractTwitterUsername(xAccount?.username || "") === extractTwitterUsername(ip.owner_account) &&
    ip.owner_account_type === "twitter"

  const isUserTheOwner = isUserTwitterOwner

  const isUserAlreadyOwner =
    userAddress?.toLowerCase() === ip.owner_address?.toLowerCase() && ip.status === IP_STATUS.REGISTERED

  const isIpOwner = isUserAlreadyOwner || isUserTheOwner

  return {
    isIpOwner,
    isUserAlreadyOwner,
    isUserTheOwner,
    userAddress,
    hasTwitterConnected,
  }
}
