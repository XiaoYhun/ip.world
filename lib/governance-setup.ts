/**
 * Server-side governance space setup utilities.
 *
 * These functions must ONLY be imported from server-side code (API routes).
 * They handle ENS subdomain creation and Snapshot space creation
 * for per-token governance spaces.
 *
 * Requires environment variables:
 * - GOVERNANCE_DEPLOYER_KEY: Private key that owns ip-world.eth ENS domain
 * - NEXT_PUBLIC_CHAIN_ID: Chain ID (1315 = Aeneid testnet, 1514 = Story mainnet)
 * - Optional: ENS_NAME_WRAPPER_ADDRESS, ENS_RESOLVER_ADDRESS, ENS_PARENT_NODE, ENS_RPC_URL
 */

import snapshot from "@snapshot-labs/snapshot.js"
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  namehash,
  type Address,
  type Chain,
} from "viem"
import { mainnet, sepolia } from "viem/chains"
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts"
import { SNAPSHOT_PROPOSAL_MIN_SCORE, SNAPSHOT_VOTE_MIN_SCORE, SNAPSHOT_QUORUM, getVotingPeriodSeconds } from "@/lib/governance-constants"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARENT_DOMAIN = "ip-world.eth"

// ENS Name Wrapper ABI - label is passed as a string so the subgraph indexes the plaintext label
const ENS_NAME_WRAPPER_ABI = parseAbi([
  "function setSubnodeRecord(bytes32 parentNode, string memory label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) public returns (bytes32 node)",
])

const ENS_CONFIG = {
  mainnet: {
    nameWrapper: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401" as Address,
    resolver: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" as Address,
    parentNode:
      "0x39cf1f8da6dcc849ede283c525d22fcfdd8b377b01957f283c8647822e3c49c3" as `0x${string}`,
    rpcUrl: "https://eth.llamarpc.com",
  },
  sepolia: {
    nameWrapper: "0x0635513f179D50A207757E05759CbD106d7dFcE8" as Address,
    resolver: "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5" as Address,
    parentNode:
      "0x39cf1f8da6dcc849ede283c525d22fcfdd8b377b01957f283c8647822e3c49c3" as `0x${string}`,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isTestMode(): boolean {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1514")
  return chainId === 1315
}

function getENSConfig() {
  return isTestMode() ? ENS_CONFIG.sepolia : ENS_CONFIG.mainnet
}

function getENSChain(): Chain {
  return isTestMode() ? sepolia : mainnet
}

function getSnapshotHubUrl(): string {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1514")
  return chainId === 1315
    ? "https://testnet.hub.snapshot.org"
    : "https://hub.snapshot.org"
}

function getDeployerAccount(): PrivateKeyAccount {
  const privateKey = process.env.GOVERNANCE_DEPLOYER_KEY
  if (!privateKey) {
    throw new Error("GOVERNANCE_DEPLOYER_KEY not configured")
  }
  return privateKeyToAccount(
    `0x${privateKey.replace(/^0x/, "")}` as `0x${string}`
  )
}

/** Sanitise a string for use as an ENS label. */
function cleanLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const MAX_IP_HANDLE_LENGTH = 24
const MAX_SYMBOL_LENGTH = 12

/**
 * Builds a Snapshot-compatible space ID for a token.
 * Format: {symbol}-{last4hex}.{handle}.ip-world.eth
 * - symbol: sanitized, lowercased, max 12 chars
 * - last4hex: last 4 hex chars of token address (uniqueness within IP)
 * - handle: sanitized IP handle, max 24 chars
 * Total max: 12 + 1 + 4 + 1 + 24 + 14 = 56 chars (well under Snapshot's 64 limit)
 */
export function buildTokenSpaceId(
  tokenAddress: string,
  tokenSymbol: string,
  ipHandle: string
): string {
  const cleanHandle = cleanLabel(ipHandle).slice(0, MAX_IP_HANDLE_LENGTH)
  const cleanSymbol = cleanLabel(tokenSymbol).slice(0, MAX_SYMBOL_LENGTH)
  const addrHex = tokenAddress.replace(/^0x/i, "").toLowerCase()
  const last4 = addrHex.slice(-4)
  return `${cleanSymbol}-${last4}.${cleanHandle}.ip-world.eth`
}

/**
 * Extracts just the token-level ENS label from buildTokenSpaceId format.
 * e.g. "tv2-515d" from "tv2-515d.handle.ip-world.eth"
 */
export function buildTokenLabel(tokenAddress: string, tokenSymbol: string): string {
  const cleanSymbol = cleanLabel(tokenSymbol).slice(0, MAX_SYMBOL_LENGTH)
  const addrHex = tokenAddress.replace(/^0x/i, "").toLowerCase()
  const last4 = addrHex.slice(-4)
  return `${cleanSymbol}-${last4}`
}

// ---------------------------------------------------------------------------
// ENS Subdomain Creation
// ---------------------------------------------------------------------------

interface CreateTokenSubdomainRequest {
  /** IP-level subdomain label (e.g. "pepe" for pepe.ip-world.eth) */
  ipSubdomain: string
  /** Token address */
  tokenAddress: string
  /** Token symbol (used with address suffix to build short ENS label) */
  tokenSymbol: string
}

interface ENSSubdomainResult {
  subdomain: string
  txHash: string
  fullDomain: string
}

/**
 * Creates a token-level ENS sub-subdomain: {symbol}-{last4hex}.{ipSubdomain}.ip-world.eth
 *
 * The deployer account must own the IP-level subdomain.
 */
export async function createTokenENSSubdomain(
  request: CreateTokenSubdomainRequest
): Promise<ENSSubdomainResult> {
  const account = getDeployerAccount()
  const config = getENSConfig()
  const chain = getENSChain()

  const nameWrapperAddress = (process.env.ENS_NAME_WRAPPER_ADDRESS ||
    config.nameWrapper) as Address
  const resolverAddress = (process.env.ENS_RESOLVER_ADDRESS ||
    config.resolver) as Address
  const ensRpcUrl = process.env.ENS_RPC_URL || config.rpcUrl

  const publicClient = createPublicClient({
    chain,
    transport: http(ensRpcUrl),
  })
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(ensRpcUrl),
  })

  const cleanIpSubdomain = cleanLabel(request.ipSubdomain)
  const tokenLabel = buildTokenLabel(request.tokenAddress, request.tokenSymbol)

  // Parent node = namehash of {ipSubdomain}.ip-world.eth
  const ipFullDomain = `${cleanIpSubdomain}.${PARENT_DOMAIN}`
  const ipParentNode = namehash(ipFullDomain) as `0x${string}`

  console.log(
    `[GOVERNANCE-SETUP] Creating token subdomain: ${tokenLabel}.${ipFullDomain}`
  )

  const txHash = await walletClient.writeContract({
    address: nameWrapperAddress,
    abi: ENS_NAME_WRAPPER_ABI,
    functionName: "setSubnodeRecord",
    args: [
      ipParentNode,
      tokenLabel,
      account.address,
      resolverAddress,
      BigInt(0),
      0,
      BigInt(0),
    ],
  })

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    timeout: 300_000,
  })
  if (receipt.status !== "success") {
    throw new Error("Token ENS subdomain creation transaction failed")
  }

  const fullDomain = `${tokenLabel}.${ipFullDomain}`
  console.log(`[GOVERNANCE-SETUP] Token subdomain created: ${fullDomain}`)

  return { subdomain: tokenLabel, txHash, fullDomain }
}

// ---------------------------------------------------------------------------
// Snapshot Space Creation
// ---------------------------------------------------------------------------

interface CreateTokenSpaceRequest {
  ipName: string
  ipHandle: string
  ipDescription: string
  ipImageURL: string
  tokenAddress: string
  tokenSymbol: string
  safeAddress: string
  spaceId: string
  ipOwnerAddress?: string
}

/**
 * Creates a private per-token Snapshot space.
 * - Uses erc20-balance-of strategy for the given token address
 * - Platform wallet is admin, IP owner is moderator
 */
export async function createTokenSnapshotSpace(
  request: CreateTokenSpaceRequest
): Promise<string> {
  const account = getDeployerAccount()
  const snapshotHubUrl = getSnapshotHubUrl()
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "1514"

  // Build a wallet adapter that snapshot.js can use
  const wallet = {
    address: account.address,
    _signTypedData: async (
      domain: unknown,
      types: Record<string, unknown>,
      message: unknown
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { EIP712Domain, ...typesWithoutDomain } = types
      return await account.signTypedData({
        domain: domain as Parameters<typeof account.signTypedData>[0]["domain"],
        types: typesWithoutDomain as Parameters<typeof account.signTypedData>[0]["types"],
        primaryType: Object.keys(typesWithoutDomain)[0],
        message: message as Record<string, unknown>,
      })
    },
  }

  const spaceConfig = {
    name: `${request.ipName || request.ipHandle} - ${request.tokenSymbol}`,
    symbol: request.tokenSymbol,
    network: chainId,
    avatar: request.ipImageURL || "",
    about: request.ipDescription || "",
    private: true,
    filters: { onlyMembers: false },
    strategies: [
      {
        name: "erc20-balance-of",
        params: {
          address: request.tokenAddress,
          symbol: request.tokenSymbol,
          decimals: 18,
        },
        network: chainId,
      },
    ],
    treasuries: [
      {
        name: `${request.ipName || request.ipHandle} Treasury`,
        address: request.safeAddress,
        network: chainId,
      },
    ],
    plugins: {},
    voting: { delay: 0, period: getVotingPeriodSeconds(), quorum: SNAPSHOT_QUORUM, privacy: "any" },
    validation: {
      name: "basic",
      params: { minScore: SNAPSHOT_PROPOSAL_MIN_SCORE },
    },
    voteValidation: {
      name: "basic",
      params: {
        strategies: [
          {
            name: "erc20-balance-of",
            network: chainId,
            params: {
              address: request.tokenAddress,
              symbol: request.tokenSymbol,
              decimals: 18,
            },
          },
        ],
        minScore: SNAPSHOT_VOTE_MIN_SCORE,
      },
    },
    admins: [account.address],
    ...(request.ipOwnerAddress
      ? { moderators: [request.ipOwnerAddress] }
      : {}),
  }

  const client = new snapshot.Client712(snapshotHubUrl)

  // @ts-expect-error - snapshot.js wallet adapter type incompatibility
  await client.space(wallet, wallet.address, {
    space: request.spaceId,
    settings: JSON.stringify(spaceConfig),
  })

  console.log(`[GOVERNANCE-SETUP] Snapshot space created: ${request.spaceId}`)
  return request.spaceId
}

/**
 * Registers a space as a child of ip-world.eth so proposals roll up.
 * Non-fatal — failure doesn't block governance functionality.
 */
export async function registerChildSpace(childSpaceId: string): Promise<void> {
  const account = getDeployerAccount()
  const snapshotHubUrl = getSnapshotHubUrl()
  const parentSpaceID = "ip-world.eth"

  const wallet = {
    address: account.address,
    _signTypedData: async (
      domain: unknown,
      types: Record<string, unknown>,
      message: unknown
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { EIP712Domain, ...typesWithoutDomain } = types
      return await account.signTypedData({
        domain: domain as Parameters<typeof account.signTypedData>[0]["domain"],
        types: typesWithoutDomain as Parameters<typeof account.signTypedData>[0]["types"],
        primaryType: Object.keys(typesWithoutDomain)[0],
        message: message as Record<string, unknown>,
      })
    },
  }

  const client = new snapshot.Client712(snapshotHubUrl)

  const response = await fetch(`${snapshotHubUrl}/api/spaces/${parentSpaceID}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch parent space: ${response.statusText}`)
  }

  const parentSpace = (await response.json()) as Record<string, unknown> & {
    children?: string[]
  }
  const currentChildren = parentSpace.children || []

  if (currentChildren.includes(childSpaceId)) {
    return // already registered
  }

  const updatedChildren = [...currentChildren, childSpaceId]

  const validSettings: Record<string, unknown> = {
    name: parentSpace.name,
    network: parentSpace.network,
    children: updatedChildren,
    voting: parentSpace.voting,
    strategies: parentSpace.strategies,
    validation: parentSpace.validation,
    filters: parentSpace.filters,
    voteValidation: parentSpace.voteValidation,
    treasuries: parentSpace.treasuries,
    plugins: parentSpace.plugins,
    categories: parentSpace.categories,
    moderators: parentSpace.moderators,
    members: parentSpace.members,
    admins: parentSpace.admins,
    private: parentSpace.private,
  }

  // Only include optional fields if they exist
  for (const key of [
    "symbol",
    "avatar",
    "about",
    "website",
    "twitter",
    "github",
    "coingecko",
    "domain",
    "skin",
    "guidelines",
    "template",
    "parent",
  ]) {
    if (parentSpace[key]) validSettings[key] = parentSpace[key]
  }

  // @ts-expect-error - snapshot.js wallet adapter type incompatibility
  await client.space(wallet, wallet.address, {
    space: parentSpaceID,
    settings: JSON.stringify(validSettings),
  })

  console.log(
    `[GOVERNANCE-SETUP] Registered ${childSpaceId} as child of ${parentSpaceID}`
  )
}
