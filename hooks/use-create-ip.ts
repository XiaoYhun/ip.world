import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Address } from "viem"
import { useAccount } from "@/hooks/use-account"
import { createIp } from "@/actions/ip/create-ip"
import { Ip } from "@/types/ip"

const useCreateIp = (connectingTokenAddress?: Address, onSuccess?: (ip: Ip) => void) => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { address: connectedAddress } = useAccount()

  const [ip, setIp] = useState<Ip | null>(null)

  useEffect(() => {
    if (ip) {
      onSuccess?.(ip)
      toast.success(`${ip.title} ip created successfully`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip])

  const preRegisterIpCall = async (ipData: Record<string, string | boolean | number>) => {
    if (!connectedAddress) return

    toast(`Creating ${ipData.title} ip...`)

    setIsPending(true)
    try {
      const createdIp = await createIp(ipData, getAuthToken())
      if (createdIp?.errors?.length > 0) {
        setIsPending(false)
        for (let i = 0; i < createdIp.errors.length; i++) {
          toast.error(createdIp.errors[i].message)
        }
        return
      } else if (!createdIp?.errors && createdIp?.message) {
        setIsPending(false)
        toast.error(createdIp.message)
        return
      }

      setIp(createdIp)
      setIsPending(false)
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Failed to create IP"))
      setIsPending(false)
      toast.error("failed to create ip")
    }
  }

  return {
    isPending: isPending,
    preRegisterIpCall,
    error,
  }
}

export default useCreateIp
