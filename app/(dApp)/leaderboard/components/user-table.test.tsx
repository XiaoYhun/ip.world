import React from "react"
import { act } from "react-dom/test-utils"
import { createRoot, Root } from "react-dom/client"
import UserTable from "./user-table"

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock("@/components/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: vi.fn(), inView: false }),
}))

vi.mock("../actions", () => ({
  fetchLeaderboard: vi.fn(),
}))

describe("UserTable", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
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

  it("renders the VOLUME column from trading_volume instead of total_points", async () => {
    await act(async () => {
      root.render(
        <UserTable
          initialLeaderboard={[
            {
              avatar_url: "",
              display_name: "StaticBagelCoded",
              joined_at: "",
              rank: 6,
              referral_amount: 0,
              referral_points: 0,
              tier: "GOAT",
              total_points: 134236.14,
              trading_points: 4186.14,
              trading_volume: 20930.7,
              username: "StaticBagelCoded",
              wallet_address: "0xf62900000000000000000000000000000000f6fe",
            },
          ]}
          initialTotal={1}
        />
      )
    })

    expect(container.textContent).toContain("$20K")
    expect(container.textContent).not.toContain("$134K")
  })
})
