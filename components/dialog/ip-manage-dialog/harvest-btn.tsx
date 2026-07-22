import { useEffect } from "react"
import { toast } from "sonner"
import { Address } from "viem"
import { useWaitForTransactionReceipt } from "wagmi"
import { useEmbeddedWriteContract } from "@/hooks/use-embedded-write-contract"
import { Button } from "@/components/ui/button"

import Spinner from "@/components/ui/spinner"
import { env } from "@/config"
import IPWorldABI from "@/config/IPWorld.abi.json"

const HarvestBtn = ({ tokenAddress, refetch }: { tokenAddress: Address; refetch: () => void }) => {
  const { isPending: isPendingTx, data, writeContract } = useEmbeddedWriteContract()
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError,
  } = useWaitForTransactionReceipt({
    hash: data,
    query: {
      refetchOnWindowFocus: false,
    },
  })

  const handleHarvest = () => {
    writeContract({
      address: env.NEXT_PUBLIC_IP_WORLD_ADDRESS,
      abi: IPWorldABI,
      functionName: "harvest",
      args: [tokenAddress],
    })
  }

  useEffect(() => {
    if (isConfirmed) {
      toast.success("transaction success")
      refetch()
    }
  }, [isConfirmed, refetch])

  useEffect(() => {
    if (isError) {
      toast.error("transaction failed, please try again")
    }
  }, [isError])

  return (
    <Button variant="outline" onClick={handleHarvest} className="w-24">
      {isPendingTx || isConfirming ? <Spinner size={24} /> : "Harvest"}
    </Button>
  )
}

export default HarvestBtn
