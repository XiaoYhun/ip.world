"use client"

import { useCallback, useState } from "react"
import { Address, WalletClient } from "viem"
import { usePublicClient, useWalletClient } from "wagmi"
import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { getClaimExistingIpSig } from "@/actions/signature/claim-existing-ip"
import { getLicensingPermissionsConfig, ipAccountStateAbi } from "@/lib/contracts/licensing-config"
import { SIGNATURE_LENGTH, SIGNATURE_R_LENGTH, SIGNATURE_S_LENGTH, SIGNATURE_V_LENGTH } from "@/lib/constants"
import { errorReporter } from "@/lib/error-reporting"
import { ClaimSignatureParams, ClaimSignatureResponse, SignatureComponents } from "@/types/claim"
import { AccessPermission, ChainIds, getPermissionSignature } from "@story-protocol/core-sdk"

interface UseClaimSignatureResult {
  generateSignatures: (params: ClaimSignatureParams) => Promise<{
    operatorSignature: SignatureComponents
    ipOwnerSignature: SignatureComponents
    deadline: number
  } | null>
  isGenerating: boolean
  error: string | null
}

/**
 * Hook for generating signatures required for IP claim operations
 * Handles both operator signature (from backend) and IP owner signature (from wallet)
 */
export const useClaimSignature = (): UseClaimSignatureResult => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const validateSignatureComponents = useCallback((signature: SignatureComponents, type: string): boolean => {
    if (!signature.v || signature.v.toString().length !== SIGNATURE_V_LENGTH) {
      errorReporter.reportError(new Error(`Invalid ${type} signature format: v`), {
        component: "useClaimSignature",
        action: "validateSignature",
        severity: "medium",
      })
      return false
    }
    if (!signature.r || signature.r.length !== SIGNATURE_R_LENGTH) {
      errorReporter.reportError(new Error(`Invalid ${type} signature format: r`), {
        component: "useClaimSignature",
        action: "validateSignature",
        severity: "medium",
      })
      return false
    }
    if (!signature.s || signature.s.length !== SIGNATURE_S_LENGTH) {
      errorReporter.reportError(new Error(`Invalid ${type} signature format: s`), {
        component: "useClaimSignature",
        action: "validateSignature",
        severity: "medium",
      })
      return false
    }
    return true
  }, [])

  const getOperatorSignature = useCallback(
    async (
      params: ClaimSignatureParams
    ): Promise<{
      signature: SignatureComponents
      deadline: number
    } | null> => {
      try {
        const response = await getClaimExistingIpSig(params, getAuthToken())

        if (response?.error || response?.message) {
          const errorMsg = response.error || response.message || "Failed to get operator signature"
          setError(errorMsg)
          errorReporter.reportError(new Error(errorMsg), {
            component: "useClaimSignature",
            action: "getOperatorSignature",
            severity: "high",
          })
          return null
        }

        const { v: opV, r: opR, s: opS, deadline } = response as ClaimSignatureResponse

        if (!opV || !opR || !opS || deadline === undefined || deadline === null) {
          const errorMsg = "Invalid operator signature received"
          setError(errorMsg)
          errorReporter.reportError(new Error(errorMsg), {
            component: "useClaimSignature",
            action: "getOperatorSignature",
            severity: "high",
          })
          return null
        }

        const signature: SignatureComponents = {
          v: opV,
          r: `0x${opR}`,
          s: `0x${opS}`,
        }

        if (!validateSignatureComponents(signature, "operator")) {
          return null
        }

        return { signature, deadline }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error getting operator signature"
        setError(errorMsg)
        errorReporter.reportError(error instanceof Error ? error : new Error(errorMsg), {
          component: "useClaimSignature",
          action: "getOperatorSignature",
          severity: "high",
        })
        return null
      }
    },
    [validateSignatureComponents]
  )

  const getIpAccountData = useCallback(
    async (ipaAddress: Address): Promise<`0x${string}` | null> => {
      try {
        const ipAccountState = await publicClient?.readContract({
          address: ipaAddress,
          abi: ipAccountStateAbi,
          functionName: "state",
        })
        return ipAccountState as `0x${string}`
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to get IP account state"
        setError(errorMsg)
        errorReporter.reportError(error instanceof Error ? error : new Error(errorMsg), {
          component: "useClaimSignature",
          action: "getIpAccountData",
          severity: "high",
        })
        return null
      }
    },
    [publicClient]
  )

  const getIpOwnerSignature = useCallback(
    async (
      ipaAddress: Address,
      state: `0x${string}`,
      deadline: number,
      walletClient: WalletClient
    ): Promise<SignatureComponents | null> => {
      try {
        const permissionsConfig = getLicensingPermissionsConfig()

        const permissions = [
          {
            ipId: ipaAddress,
            signer: permissionsConfig.signer,
            to: permissionsConfig.licensingModule,
            func: permissionsConfig.attachLicenseTermsFunc,
            permission: AccessPermission.ALLOW,
          },
          {
            ipId: ipaAddress,
            signer: permissionsConfig.signer,
            to: permissionsConfig.licensingModule,
            func: permissionsConfig.setLicensingConfigFunc as unknown as string,
            permission: AccessPermission.ALLOW,
          },
        ]

        const { signature: sdkSignature } = await getPermissionSignature({
          ipId: ipaAddress,
          state,
          deadline,
          wallet: walletClient,
          chainId: walletClient.chain?.id as ChainIds,
          permissions,
        })

        if (sdkSignature.length !== SIGNATURE_LENGTH) {
          const errorMsg = "Invalid signature format received"
          setError(errorMsg)
          errorReporter.reportError(new Error(errorMsg), {
            component: "useClaimSignature",
            action: "getIpOwnerSignature",
            severity: "high",
          })
          return null
        }

        const signature: SignatureComponents = {
          v: parseInt(sdkSignature.slice(-2), 16),
          r: sdkSignature.slice(0, 66) as `0x${string}`,
          s: ("0x" + sdkSignature.slice(66, 130)) as `0x${string}`,
        }

        if (!validateSignatureComponents(signature, "IP owner")) {
          return null
        }

        return signature
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to generate permission signature"
        setError(errorMsg)
        errorReporter.reportError(error instanceof Error ? error : new Error(errorMsg), {
          component: "useClaimSignature",
          action: "getIpOwnerSignature",
          severity: "high",
        })
        return null
      }
    },
    [validateSignatureComponents]
  )

  const generateSignatures = useCallback(
    async (params: ClaimSignatureParams) => {
      if (!walletClient) {
        const errorMsg = "Wallet client not available"
        setError(errorMsg)
        errorReporter.reportError(new Error(errorMsg), {
          component: "useClaimSignature",
          action: "generateSignatures",
          severity: "medium",
        })
        return null
      }

      setIsGenerating(true)
      setError(null)

      try {
        // Step 1: Get operator signature from backend
        const operatorResult = await getOperatorSignature(params)
        if (!operatorResult) {
          return null
        }

        // Step 2: Get IP account state
        const state = await getIpAccountData(params.ipa_id)
        if (!state) {
          return null
        }

        // Step 3: Get IP owner signature from wallet
        const ipOwnerSignature = await getIpOwnerSignature(params.ipa_id, state, operatorResult.deadline, walletClient)
        if (!ipOwnerSignature) {
          return null
        }

        return {
          operatorSignature: operatorResult.signature,
          ipOwnerSignature,
          deadline: operatorResult.deadline,
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to generate signatures"
        setError(errorMsg)
        errorReporter.reportError(error instanceof Error ? error : new Error(errorMsg), {
          component: "useClaimSignature",
          action: "generateSignatures",
          severity: "high",
        })
        return null
      } finally {
        setIsGenerating(false)
      }
    },
    [walletClient, getOperatorSignature, getIpAccountData, getIpOwnerSignature]
  )

  return {
    generateSignatures,
    isGenerating,
    error,
  }
}
