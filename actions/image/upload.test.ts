import type { MockedFunction } from "vitest"

vi.mock("@/config", () => ({
  env: {
    NEXT_PUBLIC_API_BASE_URL: "https://dev-api.ip.world/api/v1",
  },
}))

vi.mock("@/lib/server/fetcher", () => ({
  __esModule: true,
  default: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  createContext: vi.fn(() => ({})),
}))

vi.mock("@/lib/server-errors", () => ({
  ErrHandler: {
    handleResponseError: vi.fn(async (response: Response) => ({
      error: await response.text(),
      status: response.status,
    })),
    handleGenericError: vi.fn((error: Error) => ({
      error: error.message,
      status: 500,
    })),
  },
}))

import fetchWithJWTCheck from "@/lib/server/fetcher"
import { uploadImage } from "./upload"

describe("uploadImage", () => {
  const fetchWithJWTCheckMock = fetchWithJWTCheck as MockedFunction<typeof fetchWithJWTCheck>
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchWithJWTCheckMock.mockReset()
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it("uses the Next proxy for presign and uploads the raw file to the signed URL", async () => {
    fetchWithJWTCheckMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        url: "https://storage.googleapis.com/upload-signed-url",
        object_url: "https://dev.cdn.ip.world/remixes/123",
      }),
    } as Response)

    fetchMock.mockResolvedValue({
      ok: true,
    } as Response)

    const formData = new FormData()
    const file = new File(["demo"], "demo.jpg", { type: "image/jpeg" })
    formData.append("file", file)

    const result = await uploadImage(formData, "remix", "jwt-token")

    expect(fetchWithJWTCheckMock).toHaveBeenCalledWith(
      "/api/proxy/images?type=remix",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "remix", content_type: "image/jpeg" }),
      },
      "jwt-token"
    )
    expect(fetchMock).toHaveBeenCalledWith("https://storage.googleapis.com/upload-signed-url", {
      method: "PUT",
      headers: {
        "Content-Type": "image/jpeg",
      },
      body: file,
    })
    expect(result).toBe("https://dev.cdn.ip.world/remixes/123")
  })

  it("rejects unsupported image types before requesting a signed URL", async () => {
    const formData = new FormData()
    const file = new File(["<svg></svg>"], "demo.svg", { type: "image/svg+xml" })
    formData.append("file", file)

    const result = await uploadImage(formData, "remix", "jwt-token")

    expect(fetchWithJWTCheckMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      error: "Unsupported image type: image/svg+xml",
      status: 400,
    })
  })
})
