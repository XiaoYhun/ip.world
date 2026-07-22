"use client"

import { useCallback, useState } from "react"
import { Address, isAddress } from "viem"
import { usePublicClient } from "wagmi"
import { useAccount } from "@/hooks/use-account"

interface UseVerifyIpOwnershipProps {
  onVerificationResult?: (isOwner: boolean, error?: string) => void
}

const useVerifyIpOwnership = ({ onVerificationResult }: UseVerifyIpOwnershipProps = {}) => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState<boolean | null>(null)

  const { address: connectedAddress } = useAccount()
  const publicClient = usePublicClient()

  const verifyOwnership = useCallback(
    async (ipaAddress: string) => {
      if (!connectedAddress || !publicClient) {
        const error = "Please connect your wallet"
        setVerificationError(error)
        onVerificationResult?.(false, error)
        return false
      }

      if (!isAddress(ipaAddress)) {
        const error = "Invalid IPA address"
        setVerificationError(error)
        onVerificationResult?.(false, error)
        return false
      }

      setIsVerifying(true)
      setVerificationError(null)
      setIsOwner(null)

      try {
        // Step 1: Get the IP Account's underlying NFT info by calling token() function
        // This mimics: IIPAccount ipAccount = IIPAccount(payable(ipaId)); (, address tokenContract, uint256 tokenId) = ipAccount.token();
        const ipAccountResult = await publicClient.readContract({
          address: ipaAddress as Address,
          abi: [
            {
              name: "token",
              type: "function",
              stateMutability: "view",
              inputs: [],
              outputs: [
                { name: "chainId", type: "uint256" },
                { name: "tokenContract", type: "address" },
                { name: "tokenId", type: "uint256" },
              ],
            },
          ],
          functionName: "token",
        })

        const [, tokenContract, tokenId] = ipAccountResult as [bigint, Address, bigint]

        if (!tokenContract || tokenContract === "0x0000000000000000000000000000000000000000") {
          const error = "Invalid IP Asset - no underlying NFT found"
          setVerificationError(error)
          setIsOwner(false)
          onVerificationResult?.(false, error)
          return false
        }

        // Step 2: Get the owner of the underlying NFT
        // This mimics: address actualIpOwner = IERC721(tokenContract).ownerOf(tokenId);
        const nftOwner = await publicClient.readContract({
          address: tokenContract,
          abi: [
            {
              name: "ownerOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "tokenId", type: "uint256" }],
              outputs: [{ name: "", type: "address" }],
            },
          ],
          functionName: "ownerOf",
          args: [tokenId],
        })

        // Step 3: Check if the connected wallet is the owner
        const ownershipResult = (nftOwner as Address).toLowerCase() === connectedAddress.toLowerCase()

        if (!ownershipResult) {
          const error = "You are not the owner of this IP Asset"
          setVerificationError(error)
          setIsOwner(false)
          onVerificationResult?.(false, error)
          return false
        }

        // Success - user owns the IP Asset
        setIsOwner(true)
        setVerificationError(null)
        onVerificationResult?.(true)
        return true
      } catch (error) {
        console.error("IP ownership verification failed:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to verify IP ownership"
        setVerificationError(errorMessage)
        setIsOwner(false)
        onVerificationResult?.(false, errorMessage)
        return false
      } finally {
        setIsVerifying(false)
      }
    },
    [connectedAddress, publicClient, onVerificationResult]
  )

  const clearVerification = useCallback(() => {
    setIsOwner(null)
    setVerificationError(null)
  }, [])

  return {
    verifyOwnership,
    clearVerification,
    isVerifying,
    verificationError,
    isOwner,
  }
}

export default useVerifyIpOwnership
