import { Address, zeroAddress } from "viem"
import { useReadContract } from "wagmi"
import { useAccount } from "@/hooks/use-account"
import { env } from "@/config"
import IpWorldABI from "@/config/IPWorld.abi.json"

const useCheckIpOwnershipEligibility = (ipaId: string) => {
  const { address } = useAccount()

  const { data: ipaInfo } = useReadContract({
    abi: IpWorldABI,
    address: env.NEXT_PUBLIC_IP_WORLD_ADDRESS,
    functionName: "ipaInfo",
    args: [ipaId ?? zeroAddress],
  })

  const info = ipaInfo as { recipient: Address }

  return address && info?.recipient && address?.toLowerCase() === info?.recipient?.toLowerCase()
}

export default useCheckIpOwnershipEligibility
