import { cn } from "@/lib/utils"
import { isAllowedVerificationDocumentFile, verificationDocumentAccept } from "@/lib/verification-document-upload"
import { normalizeCategoryKey } from "@/lib/verification-criteria"
import { Upload } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { EnumIPRightType } from "../types"
import { Ip } from "@/types/ip"
import { useVerificationForm } from "../form-context"

const LIST_ITEMS = [
  "Early design documents or specifications",
  "Development screenshots with timestamps",
  "Code samples or architecture diagrams",
  "Beta testing records or user feedback",
]

const IP_DOCUMENT_REQUIREMENTS = {
  [EnumIPRightType.COPYRIGHT]: [
    "Copyright registration certificate",
    "Copyright assignment or work-for-hire agreement",
    "Signed declaration of authorship",
  ],
  [EnumIPRightType.TRADEMARK]: [
    "Trademark registration or filing receipt",
    "Assignment or ownership transfer document",
    "Trademark license agreement (if applicable)",
  ],
  [EnumIPRightType.NAME_IMAGE_LIKENESS]: [
    "Signed NIL or consent agreement",
    "Representation authorization letter",
    "Talent or appearance release",
  ],
  [EnumIPRightType.LICENSE_AGREEMENT]: [
    "Signed license agreement",
    "Written authorization granting usage rights",
    "Partnership or collaboration agreement",
  ],
  [EnumIPRightType.UNKNOWN_SELECTION]: [
    "Any signed agreement related to this IP",
    "Any registration or filing documents (copyright, trademark, etc.)",
    "Any written permission or authorization you’ve received",
    "Any formal document that helps explain your ownership or rights",
  ],
}

const PROOF_OF_CREATION_CRITERIA = {
  pet: [
    "Adoption, registration, or veterinary records",
    "Original photos or videos not publicly released",
    "Breeding, ownership, or care documentation tied to you",
  ],

  person: [
    "Government-issued ID",
    "Professional contracts, representation agreements, or releases",
    "Official documents linking you to the identity (e.g. agent letter)",
  ],

  trend: [
    "Internal drafts, notes, or concept documents",
    "Original files or materials used to seed the trend",
    "Early planning artifacts showing intentional creation",
  ],

  game: [
    "Early design documents, pitch decks, or specs",
    "Internal builds, versioned files, or development logs",
    "Playtest records, QA notes, or milestone documentation",
  ],

  technology: [
    "Technical specifications, architecture docs, or internal memos",
    "Prototype builds, internal demos, or versioned artifacts",
    "Repository history exports or commit logs (PDF/exported)",
  ],

  meme: [
    "Original source files (PSD, AI, video project files, etc.)",
    "Early drafts or layered working files",
    "Metadata showing creation timestamps prior to public spread",
  ],

  movement: [
    "Founding documents or internal statements",
    "Organizational notes, charters, or planning docs",
    "Early internal communications outlining formation",
  ],

  brand: [
    "Early brand assets with creation metadata",
    "Business formation documents or ownership records",
    "Product design files, packaging drafts, or internal launches",
  ],

  character: [
    "Original sketches, model sheets, or design bibles",
    "Early narrative outlines or world-building documents",
    "Creation files showing iteration and authorship",
  ],

  art: [
    "Original source files and working drafts",
    "Export histories or creation metadata",
    "Certificates of authenticity or artist statements",
  ],

  misc: [
    "Original internal documents showing creation or control",
    "Drafts, specs, or records not publicly available",
    "Any files that clearly tie the IP's origin to you",
  ],
} as const

function ProofOfCreationCard({ ip }: { ip: Ip }) {
  const criteria =
    PROOF_OF_CREATION_CRITERIA[normalizeCategoryKey(ip.category) as keyof typeof PROOF_OF_CREATION_CRITERIA]
  return (
    <div
      className="flex w-full flex-col gap-3 rounded-[12px] border bg-neutral-700 p-4"
      style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
    >
      <div className="font-archivo text-sm font-semibold">Proof of Creation</div>
      <ul className="list-inside list-disc space-y-1.5 text-xs text-neutral-200">
        {criteria.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function LegalDocumentationCard({ ip, selectedRights }: { ip: Ip; selectedRights: string[] }) {
  const criteria = useMemo(() => {
    if (selectedRights.includes(EnumIPRightType.UNKNOWN_SELECTION)) {
      return IP_DOCUMENT_REQUIREMENTS[EnumIPRightType.UNKNOWN_SELECTION]
    }
    if (selectedRights.length === 1) {
      return IP_DOCUMENT_REQUIREMENTS[selectedRights[0] as keyof typeof IP_DOCUMENT_REQUIREMENTS]
    }
    if (selectedRights.length === 2) {
      return selectedRights
        .map((right) => IP_DOCUMENT_REQUIREMENTS[right as keyof typeof IP_DOCUMENT_REQUIREMENTS].slice(0, 2))
        .flat()
    }
    if (selectedRights.length >= 3) {
      return selectedRights
        .map((right) => IP_DOCUMENT_REQUIREMENTS[right as keyof typeof IP_DOCUMENT_REQUIREMENTS].slice(0, 1))
        .flat()
    }
    return IP_DOCUMENT_REQUIREMENTS[EnumIPRightType.UNKNOWN_SELECTION]
  }, [selectedRights])
  return (
    <div
      className="flex w-full flex-col gap-3 rounded-[12px] border bg-neutral-700 p-4"
      style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
    >
      <div className="font-archivo text-sm font-semibold">Proof of Creation</div>
      <ul className="list-inside list-disc space-y-1.5 text-xs text-neutral-200">
        {criteria.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function FileTag({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[12px] border bg-neutral-700 px-3 py-2 text-neutral-50"
      style={{
        boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)",
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FF008A] text-sm font-bold text-white">
        PDF
      </div>
      <span className="font-archivo text-sm">{name}</span>
      <button
        type="button"
        className="ml-auto cursor-pointer text-lg leading-none text-neutral-300 hover:text-white"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  )
}

export default function RightsOwnerUploadDocScreen({ selectedRights, ip }: { selectedRights: string[]; ip: Ip }) {
  const form = useVerificationForm()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const validFiles = useCallback((fileList: FileList | null): File[] => {
    if (!fileList) return []
    return Array.from(fileList).filter(isAllowedVerificationDocumentFile)
  }, [])

  const handleAddFiles = useCallback(
    (fileList: FileList | null) => {
      const newFiles = validFiles(fileList)
      if (!newFiles.length) return
      setIsUploading(true)
      // Mimic upload latency so the UI shows the spinner.
      setTimeout(() => {
        setFiles((prev) => {
          const updatedFiles = [...prev, ...newFiles]
          form.setValue("uploaded_documents", updatedFiles)
          return updatedFiles
        })
        setIsUploading(false)
      }, 500)
    },
    [validFiles, form]
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleAddFiles(e.target.files)
      e.target.value = ""
    },
    [handleAddFiles]
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      handleAddFiles(e.dataTransfer.files)
    },
    [handleAddFiles]
  )

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const triggerBrowse = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className="flex h-fit min-h-[540px] flex-col gap-8 rounded-[16px] border bg-neutral-800 p-6">
      <div>
        <div className="font-archivo mb-2 text-[24px] font-medium">IP Rights Verification</div>
        <div className="font-archivo text-sm text-neutral-100">
          You can select one or both verification methods below
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProofOfCreationCard ip={ip} />
        <LegalDocumentationCard ip={ip} selectedRights={selectedRights} />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div
          className="flex h-[150px]! flex-1 cursor-pointer items-center justify-center rounded-[20px] border border-dashed border-neutral-400 transition-all hover:bg-neutral-700"
          onClick={triggerBrowse}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={verificationDocumentAccept}
            className="hidden"
            onChange={onInputChange}
          />
          <div className="flex flex-col items-center gap-2 text-neutral-200">
            <div className="flex items-center justify-center text-white">
              {isUploading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
            <div className="font-archivo text-xs text-neutral-200">Drop or click to upload (PDF/DOCX)</div>
          </div>
        </div>
        {!!files?.length && (
          <>
            <div className="w-full border-t border-neutral-600"></div>
            <div className="flex max-h-[120px] flex-wrap gap-2 overflow-y-auto">
              {files.map((file, idx) => (
                <FileTag
                  key={`${file.name}-${idx}`}
                  name={file.name}
                  onRemove={() => {
                    const updatedFiles = files.filter((_, i) => i !== idx)
                    setFiles(updatedFiles)
                    form.setValue("uploaded_documents", updatedFiles)
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
