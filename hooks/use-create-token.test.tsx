import React, { act } from "react"
import { createRoot, Root } from "react-dom/client"
import useCreateToken from "./use-create-token"

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mockGetAuthToken = vi.fn(() => "jwt-token")
const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(), // eslint-disable-line @typescript-eslint/no-unused-vars
}
const primaryWalletAddress = "0x1111111111111111111111111111111111111111"
const embeddedWalletAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
const mockUseAccount = vi.fn(() => ({ address: primaryWalletAddress }))
const mockUseChainId = vi.fn(() => 1514)
const mockUsePublicClient = vi.fn(() => ({}))
const mockUseReadContract = vi.fn(() => ({ data: BigInt(10) }))
const mockGetCreateSig = vi.fn()
const mockCreateToken = vi.fn()
const mockDeleteIp = vi.fn(() => Promise.resolve({}))
const mockCreateIpTokenWithSig = vi.fn()
const mockUseIPWorldService = vi.fn(() => ({
  service: {
    getNonces: vi.fn(() => Promise.resolve(BigInt(1))),
    createIpTokenWithSig: mockCreateIpTokenWithSig,
  },
  isReady: true,
  embeddedWalletAddress,
}))

vi.mock("@dynamic-labs/sdk-react-core", () => ({
  getAuthToken: () => mockGetAuthToken(),
}))

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToast.error(...args),
    success: (...args: unknown[]) => mockToast.success(...args),
    loading: (...args: unknown[]) => mockToast.loading(...args),
    dismiss: (...args: unknown[]) => mockToast.dismiss(...args),
  },
}))

vi.mock("wagmi", () => ({
  useChainId: () => mockUseChainId(),
  usePublicClient: () => mockUsePublicClient(),
  useReadContract: () => mockUseReadContract(),
}))

vi.mock("@/hooks/use-account", () => ({
  useAccount: () => mockUseAccount(),
}))

vi.mock("@/hooks/use-ip-world-service", () => ({
  useIPWorldService: () => mockUseIPWorldService(),
}))

vi.mock("@/actions/signature/create", () => ({
  getCreateSig: (...args: unknown[]) => mockGetCreateSig(...args),
}))

vi.mock("@/actions/token/create-token", () => ({
  createToken: (...args: unknown[]) => mockCreateToken.apply(null, args),
}))

vi.mock("@/actions/ip/delete-ip", () => ({
  deleteIp: (...args: unknown[]) => mockDeleteIp.apply(null, args),
}))

vi.mock("./use-refresh-all-balances", () => ({
  useRefreshAllBalances: () => ({ refreshAllBalances: vi.fn() }),
}))

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function Harness({ onIpDeleted }: { onIpDeleted?: () => void }) {
  const { createTokenContractCall } = (useCreateToken as unknown as (
    onSuccess?: (tokenAddress: `0x${string}`, ipId: string) => void,
    shouldDeleteIpOnFailure?: boolean,
    onIpDeleted?: () => void
  ) => {
    createTokenContractCall: (
      remixData: Record<string, string | boolean | number>,
      ip: { id: string; ipa_id?: `0x${string}` | null }
    ) => Promise<void>
  })(undefined, true, onIpDeleted)

  return (
    <button
      onClick={() =>
        createTokenContractCall(
          {
            name: "AI story",
            symbol: "$AISTORY",
            image: "https://cdn.ip.world/remixes/1774940848660649061",
            description: "",
            buy_amount: "1",
            antiSnipe: false,
          },
          {
            id: "f385d7a7-cdc0-4b8a-ba7f-d63fe935672c",
            ipa_id: "0x0000000000000000000000000000000000000000",
          }
        )
      }
      type="button"
    >
      Launch
    </button>
  )
}

describe("useCreateToken", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.clearAllMocks()
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  async function clickLaunch() {
    const button = container.querySelector("button")
    if (!button) {
      throw new Error("Launch button not rendered")
    }

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
      await flushPromises()
    })
  }

  it("does not delete the IP when the backend remix sync fails after onchain success", async () => {
    mockGetCreateSig.mockResolvedValue({
      v: 27,
      r: "0x1",
      s: "0x2",
      deadline: "123",
    })
    mockCreateIpTokenWithSig.mockResolvedValue({
      token: "0x4DFe085fa117319389D31f8323CE9f29a26c35bD",
      pool: "0x26b1ebc0f51629b0f6e889e1119be8c1b28179cb",
      txHash: "0xabc",
      tokenCreator: embeddedWalletAddress,
    })
    mockCreateToken.mockResolvedValue({
      message: "ip with id f385d7a7-cdc0-4b8a-ba7f-d63fe935672c not found",
    })

    await act(async () => {
      root.render(<Harness />)
    })

    await clickLaunch()

    expect(mockDeleteIp).not.toHaveBeenCalled()
  })

  it("uses embedded signer address and sends deployment tx hash when registering the remix", async () => {
    mockGetCreateSig.mockResolvedValue({
      v: 27,
      r: "0x1",
      s: "0x2",
      deadline: "123",
    })
    mockCreateIpTokenWithSig.mockResolvedValue({
      token: "0x4DFe085fa117319389D31f8323CE9f29a26c35bD",
      pool: "0x26b1ebc0f51629b0f6e889e1119be8c1b28179cb",
      txHash: "0xabc",
      tokenCreator: embeddedWalletAddress,
    })
    mockCreateToken.mockResolvedValue({})

    await act(async () => {
      root.render(<Harness />)
    })

    await clickLaunch()

    expect(mockGetCreateSig).toHaveBeenCalledWith(embeddedWalletAddress, 1, false, "jwt-token")
    expect(mockCreateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        creator_address: embeddedWalletAddress,
        token_address: "0x4DFe085fa117319389D31f8323CE9f29a26c35bD",
        tx_hash: "0xabc",
      }),
      "jwt-token"
    )
  })

  it("clears stale IP state after a pre-contract failure triggers delete", async () => {
    const onIpDeleted = vi.fn()
    mockGetCreateSig.mockResolvedValue({
      error: "Failed to get signature",
    })

    await act(async () => {
      root.render(<Harness onIpDeleted={onIpDeleted} />)
    })

    await clickLaunch()

    expect(mockDeleteIp).toHaveBeenCalledWith("f385d7a7-cdc0-4b8a-ba7f-d63fe935672c", "jwt-token")
    expect(onIpDeleted).toHaveBeenCalledTimes(1)
  })
})
