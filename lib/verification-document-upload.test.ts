import { isAllowedVerificationDocumentFile, verificationDocumentAccept } from "./verification-document-upload"

describe("verification document uploads", () => {
  it("allows PDF and DOCX documents", () => {
    expect(isAllowedVerificationDocumentFile(new File(["demo"], "proof.pdf", { type: "application/pdf" }))).toBe(true)
    expect(
      isAllowedVerificationDocumentFile(
        new File(["demo"], "proof.docx", {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
      )
    ).toBe(true)
  })

  it("rejects legacy DOC and active content types", () => {
    expect(isAllowedVerificationDocumentFile(new File(["demo"], "proof.doc", { type: "application/msword" }))).toBe(
      false
    )
    expect(isAllowedVerificationDocumentFile(new File(["demo"], "proof.svg", { type: "image/svg+xml" }))).toBe(false)
    expect(isAllowedVerificationDocumentFile(new File(["demo"], "proof.pdf", { type: "text/html" }))).toBe(false)
  })

  it("exports the input accept list", () => {
    expect(verificationDocumentAccept).toBe(".pdf,.docx")
  })
})
