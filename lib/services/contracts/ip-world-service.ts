import { Address, Hash, parseEventLogs, PublicClient, WalletClient } from "viem"
import { IPWorldABI, OperatorABI } from "@/lib/contracts/abis"
import { getContractAddress } from "@/lib/contracts/addresses"
import { HarvestResult, TokenDeployedEvent, TokenInfo } from "@/lib/contracts/types"
import { START_TICK_LIST } from "@/lib/utils/token-calculations"
import { TransactionManager } from "@/lib/web3/transaction-manager"

export class IPWorldService {
  constructor(
    private publicClient: PublicClient,
    private walletClient?: WalletClient,
    private getWalletClient?: () => Promise<WalletClient>
  ) { }

  private async resolveWalletClient(): Promise<WalletClient> {
    if (this.getWalletClient) {
      return this.getWalletClient()
    }

    if (!this.walletClient) {
      throw new Error("Wallet client required for write operations")
    }

    return this.walletClient
  }

  private get contractConfig() {
    return {
      address: getContractAddress("IPWorld"),
      abi: IPWorldABI,
    }
  }

  // ============================================================================
  // Read Functions
  // ============================================================================

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: Address): Promise<TokenInfo | null> {
    try {
      const result = (await this.publicClient.readContract({
        ...this.contractConfig,
        functionName: "tokenInfo",
        args: [tokenAddress],
      })) as [Address, Address, Address, Address, number, bigint[]]

      return {
        token: result[0],
        pool: result[1],
        creator: result[2],
        ipaId: result[3],
        startTick: result[4],
        allocationList: result[5],
      }
    } catch (error) {
      console.error("Failed to get token info:", error)
      return null
    }
  }

  /**
   * Get IP recipient address
   */
  async getIpRecipient(ipaId: Address): Promise<Address | null> {
    try {
      const result = (await this.publicClient.readContract({
        ...this.contractConfig,
        functionName: "ipaRecipient",
        args: [ipaId],
      })) as Address

      return result
    } catch (error) {
      console.error("Failed to get IP recipient:", error)
      return null
    }
  }

  /**
   * Check if address is an operator
   */
  async isOperator(address: Address): Promise<boolean> {
    try {
      const result = (await this.publicClient.readContract({
        ...this.contractConfig,
        functionName: "isOperator",
        args: [address],
      })) as boolean

      return result
    } catch (error) {
      console.error("Failed to check operator status:", error)
      return false
    }
  }

  /**
   * Get owner vault address
   */
  async getOwnerVault(): Promise<Address | null> {
    try {
      const result = (await this.publicClient.readContract({
        ...this.contractConfig,
        functionName: "ownerVault",
      })) as Address

      return result
    } catch (error) {
      console.error("Failed to get owner vault:", error)
      return null
    }
  }

  /**
   * Get staking vault address
   */
  async getStakingVault(): Promise<Address | null> {
    try {
      const result = (await this.publicClient.readContract({
        ...this.contractConfig,
        functionName: "stakingVault",
      })) as Address

      return result
    } catch (error) {
      console.error("Failed to get staking vault:", error)
      return null
    }
  }

  /**
   * Get protocol fee
   */
  async getProtocolFee(): Promise<bigint> {
    try {
      const result = (await this.publicClient.readContract({
        ...this.contractConfig,
        functionName: "protocolFee",
      })) as bigint

      return result
    } catch (error) {
      console.error("Failed to get protocol fee:", error)
      return BigInt(0)
    }
  }

  /**
   * Get IP owner share constant
   */
  async getIpOwnerShare(): Promise<bigint> {
    try {
      const result = (await this.publicClient.readContract({
        ...this.contractConfig,
        functionName: "IP_OWNER_SHARE",
      })) as bigint

      return result
    } catch (error) {
      console.error("Failed to get IP owner share:", error)
      return BigInt(0)
    }
  }

  /**
   * Get token creation fee from IPWorld contract
   */
  async getCreationFee(): Promise<bigint> {
    try {
      const result = (await this.publicClient.readContract({
        ...this.contractConfig,
        functionName: "creationFee",
      })) as bigint

      return result
    } catch (error) {
      console.error("Failed to get creation fee:", error)
      return BigInt(0)
    }
  }

  /**
   * Get nonces from Operator contract
   */
  async getNonces(address: Address): Promise<bigint> {
    try {
      const result = (await this.publicClient.readContract({
        address: getContractAddress("Operator", this.publicClient.chain?.id),
        abi: OperatorABI,
        functionName: "nonces",
        args: [address],
      })) as bigint

      return result
    } catch (error) {
      console.error("Failed to get nonces:", error)
      return BigInt(0)
    }
  }

  // ============================================================================
  // Write Functions
  // ============================================================================

  /**
   * Create IP token (operator only)
   */
  async createIpToken(
    tokenCreator: Address,
    name: string,
    symbol: string,
    ipaId: Address,
    startTickList: number[],
    allocationList: bigint[]
  ): Promise<{ pool: Address; token: Address } | null> {
    return TransactionManager.executeTransaction(
      async () => {
        const walletClient = await this.resolveWalletClient()
        const hash = await walletClient.writeContract({
          ...this.contractConfig,
          functionName: "createIpToken",
          args: [tokenCreator, name, symbol, ipaId, startTickList, allocationList],
          account: walletClient.account!,
          chain: walletClient.chain,
        })

        // Wait for transaction receipt
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

        // Find TokenDeployed event in logs
        const tokenDeployedLog = receipt.logs.find(
          (log) => log.address.toLowerCase() === this.contractConfig.address.toLowerCase()
        )

        if (!tokenDeployedLog || !tokenDeployedLog.topics || tokenDeployedLog.topics.length < 4) {
          throw new Error("TokenDeployed event not found in transaction logs")
        }

        // Decode the event data manually from topics
        // topics[1] = tokenCreator, topics[2] = token, topics[3] = pool
        const token = `0x${tokenDeployedLog.topics[2]?.slice(26)}` as Address
        const pool = `0x${tokenDeployedLog.topics[3]?.slice(26)}` as Address

        return {
          pool,
          token,
        }
      },
      {
        successMessage: `Token ${name} created successfully`,
        errorMessage: "Failed to create token",
        pendingMessage: `Creating token ${name}...`,
      }
    )
  }

  /**
   * Create IP token with signature via Operator contract
   */
  async createIpTokenWithSig(
    name: string,
    symbol: string,
    ipaId: Address,
    antiSnipe: boolean,
    deadline: bigint,
    v: number,
    r: string,
    s: string,
    value?: bigint
  ): Promise<{ pool: Address; token: Address; txHash: Hash; tokenCreator: Address } | null> {
    return TransactionManager.executeTransaction(
      async () => {
        const walletClient = await this.resolveWalletClient()
        // Ensure signature components have proper format
        let formattedR = r
        let formattedS = s
        if (!r.startsWith("0x")) {
          formattedR = `0x${r}`
        }
        if (!s.startsWith("0x")) {
          formattedS = `0x${s}`
        }

        const operatorAddress = getContractAddress("Operator", this.publicClient.chain?.id)
        const operatorABI = OperatorABI
        const startTickList = START_TICK_LIST
        const allocationList = [BigInt(720_000), BigInt(250_000), BigInt(10_000)]
        const operatorArgs = [
          name,
          symbol,
          ipaId,
          startTickList,
          allocationList,
          antiSnipe,
          deadline,
          { v, r: formattedR, s: formattedS },
        ]
        let hash: Hash
        try {
          hash = await walletClient.writeContract({
            address: operatorAddress,
            abi: operatorABI,
            functionName: "createIpTokenWithSig",
            args: operatorArgs,
            value: value || BigInt(0),
            account: walletClient.account!,
            chain: walletClient.chain,
          })
        } catch (writeError) {
          console.error("writeContract failed:", writeError)
          console.error("Error details:", {
            message: writeError instanceof Error ? writeError.message : String(writeError),
            cause: writeError instanceof Error ? writeError.cause : undefined,
            stack: writeError instanceof Error ? writeError.stack : undefined,
          })
          throw writeError
        }

        // Wait for transaction receipt
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

        // Find TokenDeployed event in logs (should be from IPWorld contract)
        const tokenDeployedLog = receipt.logs.find((log) => {
          if (log.address.toLowerCase() !== this.contractConfig.address.toLowerCase()) {
            return false
          }
          try {
            const parsed = parseEventLogs({
              abi: IPWorldABI,
              logs: [log],
              eventName: "TokenDeployed",
            })
            return parsed.length > 0
          } catch {
            return false
          }
        })

        if (!tokenDeployedLog) {
          console.error(
            "Available logs:",
            receipt.logs.map((log) => ({
              address: log.address,
              topics: log.topics?.slice(0, 1), // First topic is event signature
            }))
          )
          throw new Error("TokenDeployed event not found in transaction logs")
        }

        // Parse the event to get token and pool addresses
        const parsedLogs = parseEventLogs({
          abi: IPWorldABI,
          logs: [tokenDeployedLog],
          eventName: "TokenDeployed",
        })

        const tokenDeployedEvent = parsedLogs[0] as unknown as {
          args: { pool: Address; token: Address; tokenCreator: Address }
        }
        const result = {
          pool: tokenDeployedEvent.args.pool,
          token: tokenDeployedEvent.args.token,
          txHash: hash,
          tokenCreator: tokenDeployedEvent.args.tokenCreator,
        }

        return result
      },
      {
        successMessage: `Token ${name} created successfully`,
        errorMessage: "Failed to create token",
        pendingMessage: `Creating token ${name}...`,
      }
    )
  }

  /**
   * Link tokens to IP (operator only)
   */
  async linkTokensToIp(ipaId: Address, tokenList: Address[]): Promise<Hash | null> {
    return TransactionManager.executeTransaction(
      async () => {
        const walletClient = await this.resolveWalletClient()
        const hash = await walletClient.writeContract({
          ...this.contractConfig,
          functionName: "linkTokensToIp",
          args: [ipaId, tokenList],
          account: walletClient.account!,
          chain: walletClient.chain,
        })

        return hash
      },
      {
        successMessage: "Tokens linked to IP successfully",
        errorMessage: "Failed to link tokens to IP",
        pendingMessage: "Linking tokens to IP...",
      }
    )
  }

  /**
   * Claim IP ownership (operator only)
   */
  async claimIp(ipaId: Address, recipient: Address): Promise<Hash | null> {
    return TransactionManager.executeTransaction(
      async () => {
        const walletClient = await this.resolveWalletClient()
        const hash = await walletClient.writeContract({
          ...this.contractConfig,
          functionName: "claimIp",
          args: [ipaId, recipient],
          account: walletClient.account!,
          chain: walletClient.chain,
        })

        return hash
      },
      {
        successMessage: "IP claimed successfully",
        errorMessage: "Failed to claim IP",
        pendingMessage: "Claiming IP...",
      }
    )
  }

  /**
   * Harvest LP fees for a token
   */
  async harvest(tokenAddress: Address): Promise<HarvestResult | null> {
    return TransactionManager.executeTransaction(
      async () => {
        const walletClient = await this.resolveWalletClient()
        const hash = await walletClient.writeContract({
          ...this.contractConfig,
          functionName: "harvest",
          args: [tokenAddress],
          account: walletClient.account!,
          chain: walletClient.chain,
        })

        // Wait for transaction receipt
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

        // Parse harvest events to get fee distribution info
        // Note: logs variable is parsed but not used in current implementation
        // This is intentional as we're returning simplified data for now
        parseEventLogs({
          abi: IPWorldABI,
          logs: receipt.logs,
          eventName: "Harvest",
        })

        // Return harvest result (simplified for now)
        return {
          token: tokenAddress,
          feesCollected: {
            token: tokenAddress,
            amount0: BigInt(0),
            amount1: BigInt(0),
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
          },
          distributed: {
            toOwner: BigInt(0),
            toStakers: BigInt(0),
            toPlatform: BigInt(0),
          },
        }
      },
      {
        successMessage: "Fees harvested successfully",
        errorMessage: "Failed to harvest fees",
        pendingMessage: "Harvesting fees...",
      }
    )
  }

  /**
   * Set operator status (owner only)
   */
  async setOperator(operator: Address, status: boolean): Promise<Hash | null> {
    return TransactionManager.executeTransaction(
      async () => {
        const walletClient = await this.resolveWalletClient()
        const hash = await walletClient.writeContract({
          ...this.contractConfig,
          functionName: "setOperator",
          args: [operator, status],
          account: walletClient.account!,
          chain: walletClient.chain,
        })

        return hash
      },
      {
        successMessage: `Operator ${status ? "added" : "removed"} successfully`,
        errorMessage: "Failed to update operator status",
        pendingMessage: "Updating operator status...",
      }
    )
  }

  // ============================================================================
  // Event Queries
  // ============================================================================

  /**
   * Get token deployed events
   */
  async getTokenDeployedEvents(fromBlock?: bigint, toBlock?: bigint): Promise<TokenDeployedEvent[]> {
    try {
      const logs = await this.publicClient.getLogs({
        address: this.contractConfig.address,
        event: {
          type: "event",
          name: "TokenDeployed",
          inputs: [
            { name: "tokenCreator", type: "address", indexed: true },
            { name: "token", type: "address", indexed: true },
            { name: "pool", type: "address", indexed: true },
            { name: "startTick", type: "int24", indexed: false },
          ],
        },
        fromBlock,
        toBlock,
      })

      return logs.map((log) => ({
        tokenCreator: log.args.tokenCreator!,
        token: log.args.token!,
        pool: log.args.pool!,
        startTick: log.args.startTick!,
      }))
    } catch (error) {
      console.error("Failed to get token deployed events:", error)
      return []
    }
  }

  /**
   * Get IP claimed events
   */
  async getIpClaimedEvents(
    fromBlock?: bigint,
    toBlock?: bigint
  ): Promise<Array<{ ipaId: Address; recipient: Address; blockNumber: bigint }>> {
    try {
      const logs = await this.publicClient.getLogs({
        address: this.contractConfig.address,
        event: {
          type: "event",
          name: "Claimed",
          inputs: [{ name: "ipaId", type: "address", indexed: true }],
        },
        fromBlock,
        toBlock,
      })

      return logs.map((log) => ({
        ipaId: log.args.ipaId!,
        recipient: "0x0000000000000000000000000000000000000000" as Address, // Would need to get from transaction
        blockNumber: log.blockNumber!,
      }))
    } catch (error) {
      console.error("Failed to get IP claimed events:", error)
      return []
    }
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Estimate gas for a function call
   */
  async estimateGas(functionName: string, args: unknown[], value?: bigint): Promise<bigint> {
    try {
      const walletClient = await this.resolveWalletClient()
      const gas = await this.publicClient.estimateContractGas({
        ...this.contractConfig,
        functionName,
        args,
        value,
        account: walletClient.account!,
      })

      return gas
    } catch (error) {
      console.error("Failed to estimate gas:", error)
      throw error
    }
  }

  /**
   * Simulate a contract call
   */
  async simulate(functionName: string, args: unknown[], value?: bigint): Promise<unknown> {
    try {
      const walletClient = await this.resolveWalletClient()
      const result = await this.publicClient.simulateContract({
        ...this.contractConfig,
        functionName,
        args,
        value,
        account: walletClient.account!,
      })

      return result.result
    } catch (error) {
      console.error("Failed to simulate contract call:", error)
      throw error
    }
  }
}
