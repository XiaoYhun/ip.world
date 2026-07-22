const allowedVerificationDocumentTypesByExtension = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const

const toleratedUnknownBrowserTypes = new Set(["", "application/octet-stream"])

export const verificationDocumentAccept = Object.keys(allowedVerificationDocumentTypesByExtension).join(",")

export function isAllowedVerificationDocumentFile(file: File) {
  const lowerName = file.name.toLowerCase()
  const matched = Object.entries(allowedVerificationDocumentTypesByExtension).find(([ext]) => lowerName.endsWith(ext))

  if (!matched) {
    return false
  }

  const [, expectedType] = matched
  const normalizedType = file.type.trim().toLowerCase().split(";")[0]
  return normalizedType === expectedType || toleratedUnknownBrowserTypes.has(normalizedType)
}
