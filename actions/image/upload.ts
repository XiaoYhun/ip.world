import { HttpMethod } from "@/lib/http-utils"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { getAPIRootUrl } from "@/lib/utils"
import { ErrResponse } from "@/types/error"
import { UploadFileResponse } from "@/types/response"

class UploadImageError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "UploadImageError"
    this.status = status
  }
}

const readErrorMessage = async (response: Response, fallback: string) => {
  const contentType = response.headers.get("content-type") || ""

  try {
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { error?: string; message?: string }
      return payload.error || payload.message || fallback
    }

    const text = (await response.text()).trim()
    return text || fallback
  } catch {
    return fallback
  }
}

const allowedImageUploadContentTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

const normalizeImageUploadContentType = (contentType: string) => {
  const normalized = contentType.trim().toLowerCase().split(";")[0]

  if (!normalized) {
    throw new UploadImageError("Image type is required", 400)
  }

  if (!allowedImageUploadContentTypes.has(normalized)) {
    throw new UploadImageError(`Unsupported image type: ${normalized}`, 400)
  }

  return normalized
}

export async function uploadImage(formData: FormData, type: string, jwtToken?: string): Promise<string | ErrResponse> {
  try {
    const file = formData.get("file")
    if (!(file instanceof File)) {
      throw new UploadImageError("No file provided", 400)
    }

    const contentType = normalizeImageUploadContentType(file.type)

    const signedUrlResponse = await fetchWithJWTCheck(
      `${getAPIRootUrl()}/images?type=${type}`,
      {
        method: HttpMethod.POST,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, content_type: contentType }),
      },
      jwtToken
    )

    if (!signedUrlResponse.ok) {
      throw new UploadImageError(
        await readErrorMessage(signedUrlResponse, "Failed to get upload URL"),
        signedUrlResponse.status
      )
    }

    const signedUrl = (await signedUrlResponse.json()) as UploadFileResponse

    const uploadResponse = await fetch(signedUrl.url, {
      method: HttpMethod.PUT,
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new UploadImageError(
        await readErrorMessage(uploadResponse, "Failed to upload image"),
        uploadResponse.status
      )
    }

    return signedUrl.object_url
  } catch (error) {
    if (error instanceof UploadImageError) {
      return {
        error: error.message,
        status: error.status,
      }
    }

    return {
      error: error instanceof Error ? error.message : "Upload failed",
      status: 500,
    }
  }
}
