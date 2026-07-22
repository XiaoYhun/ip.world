/**
 * Trigger a browser download of an image URL (same-origin, absolute http(s) via /api/images/proxy, or data URLs).
 */

function sanitizeFilenameBase(base: string): string {
  const s = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
  return s || "image"
}

function extFromMime(mime: string): string | null {
  if (!mime) return null
  if (mime.includes("jpeg")) return ".jpg"
  if (mime.includes("png")) return ".png"
  if (mime.includes("webp")) return ".webp"
  if (mime.includes("gif")) return ".gif"
  if (mime.includes("svg")) return ".svg"
  return null
}

function extFromPath(pathname: string): string | null {
  const m = pathname.match(/\.(png|jpe?g|webp|gif|svg)$/i)
  if (!m) return null
  const e = m[1].toLowerCase()
  return e === "jpeg" ? ".jpg" : `.${e}`
}

export async function downloadImageUrl(src: string, filenameBase: string): Promise<void> {
  if (!src?.trim()) {
    throw new Error("Missing image URL")
  }

  const base = sanitizeFilenameBase(filenameBase)

  if (src.startsWith("data:")) {
    const a = document.createElement("a")
    a.href = src
    a.download = `${base}.png`
    a.rel = "noopener"
    a.click()
    return
  }

  let fetchUrl = src
  if (src.startsWith("http://") || src.startsWith("https://")) {
    fetchUrl = `/api/images/proxy?url=${encodeURIComponent(src)}`
  }

  const res = await fetch(fetchUrl)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const blob = await res.blob()
  const mimeExt = extFromMime(blob.type || "")
  let ext = mimeExt
  if (!ext && typeof window !== "undefined") {
    try {
      ext = extFromPath(new URL(src, window.location.origin).pathname)
    } catch {
      ext = null
    }
  }
  if (!ext) ext = ".png"

  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `${base}${ext}`
    a.rel = "noopener"
    a.click()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
