import { Address } from "viem"
import { useReadContract } from "wagmi"
import { env } from "@/config"
import IpWorldABI from "@/config/IPWorld.abi.json"

const useGetOwnerVaultAddress = () => {
  const { data: ownerVaultAddress } = useReadContract({
    abi: IpWorldABI,
    address: env.NEXT_PUBLIC_IP_WORLD_ADDRESS,
    functionName: "ownerVault",
  })
  return ownerVaultAddress as Address
}

export default useGetOwnerVaultAddress
