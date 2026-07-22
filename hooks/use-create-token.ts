import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { Address } from "viem"
import { useChainId, usePublicClient, useReadContract } from "wagmi"
import { useAccount } from "@/hooks/use-account"
import { deleteIp } from "@/actions/ip/delete-ip"
import { getCreateSig } from "@/actions/signature/create"
import { createToken } from "@/actions/token/create-token"
import { bigNumberToFloat, floatToBigNumber } from "@/lib/bignumber"
import { IPWorldABI, OperatorABI } from "@/lib/contracts/abis"
import { getContractAddress } from "@/lib/contracts/addresses"
import { parseTransactionErrorMessage } from "@/lib/web3/transaction-errors"
import { START_TICK_LIST } from "@/lib/utils/token-calculations"
import { Ip } from "@/types/ip"
import { useIPWorldService } from "./use-ip-world-service"
import { useRefreshAllBalances } from "./use-refresh-all-balances"

// ⚠️ DRY RUN: Set to true to simulate the contract call without sending the transaction.
// The entire flow (nonce, signature, amount prep) runs normally, but the actual
// createIpTokenWithSig tx is only simulated via eth_call. Check browser console for logs.
export const DRY_RUN = false

interface ApiResponse {
  id?: string
  errors?: Array<{ message: string }>
  message?: string
}

interface TokenCreationData {
  name: string
  symbol: string
  image: string
  description: string
  buy_amount: string
  [key: string]: string | number | boolean
}

const MAX_REMIX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 2000

const useCreateToken = (
  onSuccess?: (tokenAddress: Address, ipId: string) => void,
  shouldDeleteIpOnFailure = false,
  onIpDeleted?: (ipId: string) => void
) => {
  const [isPending, setIsPending] = useState(false)
  const { address: connectedAddress } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { service, isReady: isServiceReady, embeddedWalletAddress } = useIPWorldService()
  const { refreshAllBalances } = useRefreshAllBalances()

  const { data: creationFee } = useReadContract({
    address: getContractAddress("IPWorld", chainId),
    abi: IPWorldABI,
    functionName: "creationFee",
  })

  const createTokenApiCall = useCallback(
    async (
      tokenAddress: Address,
      tokenData: TokenCreationData,
      ipId: string,
      creatorAddress: Address,
      txHash: string
    ): Promise<ApiResponse | undefined> => {
      if (!tokenData || !creatorAddress || !ipId || !txHash) {
        return undefined
      }

      let lastError: unknown
      for (let attempt = 0; attempt < MAX_REMIX_RETRIES; attempt++) {
        try {
          const response = await createToken(
            {
              ...tokenData,
              token_address: tokenAddress,
              creator_address: creatorAddress as string,
              ip_id: ipId as string,
              tx_hash: txHash,
            },
            getAuthToken()
          )

          // Response with a structured error body — not retryable (validation, auth, etc.)
          if (response?.errors?.length || response?.message) {
            return response
          }

          return response
        } catch (error) {
          lastError = error
          if (attempt < MAX_REMIX_RETRIES - 1) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
      }

      console.error("Failed to register token after retries:", lastError)
      return undefined
    },
    []
  )

  const handleTokenCreationSuccess = useCallback(
    async (
      tokenAddress: Address,
      tokenData: TokenCreationData,
      ip: Ip,
      creatorAddress: Address,
      txHash: string
    ): Promise<boolean> => {
      try {
        const response = await createTokenApiCall(tokenAddress, tokenData, ip.id, creatorAddress, txHash)

        if (!response) {
          toast.error("Token was created on-chain but failed to register. Please contact support with your wallet address.")
          return false
        }

        if (response.errors?.length) {
          for (const error of response.errors) {
            toast.error(error.message)
          }
          return false
        }

        if (!response.errors && response.message) {
          toast.error(response.message)
          return false
        }

        onSuccess?.(tokenAddress, ip.id)

        if (ip.is_verified) {
          try {
            const authToken = getAuthToken()
            fetch("/api/governance/spaces/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({
                tokenAddress,
                ipId: ip.id,
                tokenSymbol: tokenData.symbol,
              }),
            }).catch(() => {})
          } catch {
            // Non-blocking
          }
        }

        return true
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Token was created on-chain but failed to register. Please contact support with your token address.")
        return false
      }
    },
    [createTokenApiCall, onSuccess]
  )

  const cleanupFailedIp = useCallback(
    async (ipId: string) => {
      if (!shouldDeleteIpOnFailure) return

      const response = await deleteIp(ipId, getAuthToken())
      if (!response?.errors?.length && !response?.message) {
        onIpDeleted?.(ipId)
      }
    },
    [onIpDeleted, shouldDeleteIpOnFailure]
  )

  const createTokenContractCall = useCallback(
    async (remixData: Record<string, string | boolean | number>, ip: Ip) => {
      if (!connectedAddress) {
        toast.error("Please connect your wallet")
        return
      }

      if (!service) {
        toast.error("Service not ready")
        return
      }

      const tokenData = remixData as TokenCreationData

      // Remove duplicate loading toast - TransactionManager already shows one
      // toast(`Creating ${remixData.name} token...`)
      setIsPending(true)

      try {
        const creatorAddress = (embeddedWalletAddress ?? connectedAddress) as Address

        // Get nonce from service
        const nonce = await service.getNonces(creatorAddress)
        // Get signature from backend using the nonce
        const signature = await getCreateSig(
          creatorAddress,
          bigNumberToFloat(nonce, 0),
          remixData.antiSnipe as boolean,
          getAuthToken()
        )
        // Check if signature has errors
        if (signature?.error || signature?.message) {
          toast.error(signature.error || signature.message || "Failed to get signature")
          await cleanupFailedIp(ip.id)
          setIsPending(false)
          return
        }

        const { v, r, s, deadline } = signature

        // Validate signature components
        if (!v || !r || !s || !deadline === undefined) {
          toast.error("Invalid signature received")
          await cleanupFailedIp(ip.id)
          setIsPending(false)
          return
        }

        // Prepare buy amount - add 10 $IP creation fee to the purchase amount
        const _buyAmount = remixData.buy_amount as string
        const buyAmount = floatToBigNumber(_buyAmount.length > 0 ? _buyAmount : "0", 18)
        const fee = creationFee ? BigInt(creationFee.toString()) : BigInt(0)
        const totalValue = BigInt(buyAmount.toFixed(0)) + fee

        // Use ipa_id from IP object if available, otherwise fallback to zero address
        const ipaAddress = ip.ipa_id || "0x0000000000000000000000000000000000000000"

        if (DRY_RUN) {
          const operatorAddress = getContractAddress("Operator", chainId)
          const startTickList = START_TICK_LIST
          const allocationList = [BigInt(720_000), BigInt(250_000), BigInt(10_000)]
          let formattedR = r
          let formattedS = s
          if (!r.startsWith("0x")) formattedR = `0x${r}`
          if (!s.startsWith("0x")) formattedS = `0x${s}`

          const simArgs = [
            remixData.name as string,
            remixData.symbol as string,
            ipaAddress,
            startTickList,
            allocationList,
            remixData.antiSnipe as boolean,
            BigInt(deadline),
            { v, r: formattedR, s: formattedS },
          ] as const

          console.group("🛑 DRY RUN — createIpTokenWithSig")
          console.log("Operator:", operatorAddress)
          console.log("Account:", connectedAddress)
          console.log("Value (wei):", totalValue.toString())
          console.log("Args:", {
            name: remixData.name,
            symbol: remixData.symbol,
            ipaId: ipaAddress,
            antiSnipe: remixData.antiSnipe,
            deadline: deadline.toString(),
            buyAmount: buyAmount.toFixed(0),
            fee: fee.toString(),
            totalValue: totalValue.toString(),
          })

          try {
            const simResult = await publicClient!.simulateContract({
              address: operatorAddress,
              abi: OperatorABI,
              functionName: "createIpTokenWithSig",
              args: simArgs,
              value: totalValue,
              account: connectedAddress as Address,
            })
            console.log("✅ Simulation SUCCESS — result:", simResult.result)
            console.log("Full simulation response:", simResult)
            toast.success("DRY RUN: Simulation passed — transaction would succeed. Check console for details.")
          } catch (simError) {
            console.error("❌ Simulation FAILED:", simError)
            toast.error(`DRY RUN: Simulation failed — ${simError instanceof Error ? simError.message : String(simError)}`)
          }
          console.groupEnd()
          setIsPending(false)
          return
        }

        const result = await service.createIpTokenWithSig(
          remixData.name as string,
          remixData.symbol as string,
          ipaAddress,
          remixData.antiSnipe as boolean,
          BigInt(deadline),
          v,
          r,
          s,
          totalValue
        )

        if (result) {
          setIsPending(true)
          const success = await handleTokenCreationSuccess(result.token, tokenData, ip, result.tokenCreator, result.txHash)
          setIsPending(false)
          if (success) {
            refreshAllBalances()
          }
        } else {
          setIsPending(false)
        }
    } catch (error) {
      toast.error(parseTransactionErrorMessage(error, "Failed to create token"))
      await cleanupFailedIp(ip.id)
      setIsPending(false)
    }
  },
    [
      chainId,
      cleanupFailedIp,
      connectedAddress,
      creationFee,
      embeddedWalletAddress,
      handleTokenCreationSuccess,
      publicClient,
      refreshAllBalances,
      service,
    ]
  )

  // Get contract addresses for current chain
  const getAddresses = useCallback(() => {
    try {
      return {
        ipWorld: getContractAddress("IPWorld", chainId),
        operator: getContractAddress("Operator", chainId),
        ipOwnerVault: getContractAddress("IPOwnerVault", chainId),
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error("Failed to get contract addresses:", error)
      return null
    }
  }, [chainId])

  return {
    isPending,
    createTokenContractCall,
    creationFee: creationFee as bigint | undefined,
    isReady: isServiceReady && !!getAddresses(),
    addresses: getAddresses(),
  }
}

export default useCreateToken
