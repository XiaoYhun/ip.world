import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { isAllowedVerificationDocumentFile, verificationDocumentAccept } from "@/lib/verification-document-upload"
import { normalizeCategoryKey } from "@/lib/verification-criteria"
import { Ip } from "@/types/ip"
import { ChevronDown, ChevronUp, Upload } from "lucide-react"
import { useCallback, useRef, useState, useEffect } from "react"
import { useVerificationForm } from "../form-context"
import { EnumIPRightType } from "../types"
import ProofOfCreationIcon from "../icons/proof-of-creation"
import CopyrightIcon from "../icons/copy-right"
import NameImageLikenessIcon from "../icons/name-image-likeness"
import TrademarkIcon from "../icons/trade-mark"
import LicenseAgreementIcon from "../icons/license-agreement"

type OptionContent = {
  key: string
  icon: React.ReactNode
  title: string
  subtitle: string
  description?: string
  bullets?: string[]
}

const PROOF_OF_CREATION_BULLETS: Record<string, string[]> = {
  pet: [
    "Adoption, registration, or veterinary records",
    "Early private photos or videos of the pet",
    "Breeding, ownership, or care documentation",
  ],
  person: [
    "Government-issued ID",
    "Professional contracts, representation agreements, or releases",
    "Official documents linking you to the identity",
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
    "Repository exports or commit history files",
  ],
  meme: [
    "Original source files (PSD, AI, video project files, etc.)",
    "Early drafts or layered working files",
    "Screenshots of unpublished or early-stage versions",
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
    "Story outlines or world-building materials",
    "Iteration files showing development",
  ],
  art: [
    "Original source files and working drafts",
    "Creation metadata or export histories",
    "Certificates of authenticity or artist statements",
  ],
  misc: [
    "Original internal documents showing creation or control",
    "Drafts, specs, or records not publicly available",
    "Any files that clearly tie the intellectual property to you",
  ],
}

const RIGHTS_CONFIG: Record<string, OptionContent> = {
  [EnumIPRightType.PROOF_OF_CREATION]: {
    key: EnumIPRightType.PROOF_OF_CREATION,
    icon: <ProofOfCreationIcon />,
    title: "Proof of Creation",
    subtitle: "Original authorship or creation evidence",
    description: "Upload files showing where and how this [category_name] originally started",
  },
  [EnumIPRightType.COPYRIGHT]: {
    key: EnumIPRightType.COPYRIGHT,
    icon: <CopyrightIcon />,
    title: "Copyright",
    subtitle: "Registered or documented copyright ownership",
    description: "Upload documents proving ownership of original creative works",
    bullets: [
      "Copyright registration certificate",
      "Copyright assignment or work-for-hire agreement",
      "Intellectual property ownership record",
    ],
  },
  [EnumIPRightType.NAME_IMAGE_LIKENESS]: {
    key: EnumIPRightType.NAME_IMAGE_LIKENESS,
    icon: <NameImageLikenessIcon />,
    title: "Name, Image, Likeness",
    subtitle: "Identity or public image authorization",
    description: "Upload documents showing authorization to use or represent an identity",
    bullets: [
      "Signed NIL or consent agreement",
      "Representation or management authorization",
      "Talent release or appearance waiver",
    ],
  },
  [EnumIPRightType.TRADEMARK]: {
    key: EnumIPRightType.TRADEMARK,
    icon: <TrademarkIcon />,
    title: "Trademark",
    subtitle: "Registered name, logo, or brand rights",
    description: "Upload documents proving rights to a name, logo, or brand",
    bullets: [
      "Trademark registration or filing receipt",
      "Trademark ownership transfer or assignment",
      "Proof of active trademark status",
    ],
  },
  [EnumIPRightType.LICENSE_AGREEMENT]: {
    key: EnumIPRightType.LICENSE_AGREEMENT,
    icon: <LicenseAgreementIcon />,
    title: "License Agreement",
    subtitle: "Written permission from the original creator",
    description: "Upload authorization from the creator of this [category_name] granting usage rights",
    bullets: [
      "Signed license or authorization agreement",
      "Partnership or collaboration contract",
      "Representation or distribution rights agreement",
    ],
  },
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
      <span className="font-archivo max-w-[200px] truncate text-sm">{name}</span>
      <button
        type="button"
        className="ml-auto cursor-pointer text-lg leading-none text-neutral-300 hover:text-white"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        ×
      </button>
    </div>
  )
}

function resolveCategoryName(category: string) {
  return category === "misc" ? "entity" : category
}

function ExpandableRightCard({
  option,
  selected,
  onSelect,
  category,
}: {
  option: OptionContent
  selected: boolean
  onSelect: () => void
  category: string
}) {
  const [expanded, setExpanded] = useState(false)
  const form = useVerificationForm()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (selected) {
      setExpanded(true)
    } else {
      setExpanded(false)
      if (files.length > 0) {
        const existing = form.getValues("uploaded_documents") || []
        form.setValue(
          "uploaded_documents",
          existing.filter((f) => !files.includes(f))
        )
      }
      setFiles([])
    }
  }, [selected])

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const validFiles = useCallback((fileList: FileList | null): File[] => {
    if (!fileList) return []
    return Array.from(fileList).filter(isAllowedVerificationDocumentFile)
  }, [])

  const handleAddFiles = useCallback(
    (fileList: FileList | null) => {
      const newFiles = validFiles(fileList)
      if (!newFiles.length) return
      setIsUploading(true)
      setTimeout(() => {
        setFiles((prev) => {
          const updatedFiles = [...prev, ...newFiles]
          const existing = form.getValues("uploaded_documents") || []
          form.setValue("uploaded_documents", [...existing, ...newFiles])
          return updatedFiles
        })
        setIsUploading(false)
        if (!selected) onSelect()
      }, 500)
    },
    [validFiles, selected, onSelect, form]
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
      e.stopPropagation()
      handleAddFiles(e.dataTransfer.files)
    },
    [handleAddFiles]
  )

  const triggerBrowse = (e: React.MouseEvent) => {
    e.stopPropagation()
    inputRef.current?.click()
  }

  const bullets =
    option.key === EnumIPRightType.PROOF_OF_CREATION
      ? (PROOF_OF_CREATION_BULLETS[category.toLowerCase()] ?? PROOF_OF_CREATION_BULLETS["misc"])
      : option.bullets

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-[16px] border bg-neutral-700 transition-colors",
        selected ? "border-white" : "border-neutral-500"
      )}
      style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
    >
      <div className="flex cursor-pointer items-center gap-3 px-4 py-3" onClick={onSelect}>
        <Checkbox
          className="h-5 w-5 rounded-[4px]"
          checked={selected}
          onCheckedChange={() => onSelect()}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex size-5 shrink-0 items-center justify-center text-xl font-semibold text-white">
          {option.icon}
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="font-archivo text-base font-medium">{option.title}</div>
          <div className="text-[13px] text-neutral-200">
            {option.subtitle.replace(/\[category_name\]/g, resolveCategoryName(category))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleExpand}
          className="ml-2 flex items-center justify-center text-neutral-200 hover:text-white"
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-neutral-600 p-4">
          {option.description && (
            <div className="font-archivo mb-3 text-sm text-neutral-100">
              {option.description.startsWith("**") ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: option.description
                      .replace(/\[category_name\]/g, resolveCategoryName(category))
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              ) : (
                option.description.replace(/\[category_name\]/g, resolveCategoryName(category))
              )}
            </div>
          )}

          {bullets && bullets.length > 0 && (
            <ul className="mb-4 list-none space-y-2">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-neutral-200">
                  <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-200" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          <div
            className="flex h-[80px] w-full cursor-pointer items-center justify-center rounded-[12px] border border-dashed border-neutral-400 bg-neutral-800/50 transition-colors hover:bg-neutral-800"
            onClick={triggerBrowse}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={verificationDocumentAccept}
              className="hidden"
              onChange={onInputChange}
            />
            {isUploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <div className="flex items-center gap-2 text-neutral-300">
                <Upload size={16} />
                <span className="font-archivo text-sm font-medium">Click to upload or drag and drop</span>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <FileTag
                  key={`${file.name}-${idx}`}
                  name={file.name}
                  onRemove={() => {
                    const removedFile = files[idx]
                    const updatedFiles = files.filter((_, i) => i !== idx)
                    setFiles(updatedFiles)
                    const existing = form.getValues("uploaded_documents") || []
                    form.setValue(
                      "uploaded_documents",
                      existing.filter((f) => f !== removedFile)
                    )
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RightsSocialsScreen({
  ip,
  selectedRights,
  onSelectRight,
}: {
  ip: Ip
  selectedRights: string[]
  onSelectRight: (key: string) => void
  selectedKeys: string[]
  onSelectKey: (key: string) => void
}) {
  const category = normalizeCategoryKey(ip.category)

  const OPTIONS_ORDER = [
    EnumIPRightType.PROOF_OF_CREATION,
    EnumIPRightType.COPYRIGHT,
    EnumIPRightType.NAME_IMAGE_LIKENESS,
    EnumIPRightType.TRADEMARK,
    EnumIPRightType.LICENSE_AGREEMENT,
  ]

  return (
    <div className="max-h-[540px] min-h-[540px] overflow-y-auto rounded-[16px] border bg-neutral-800 p-6">
      <div className="flex flex-col gap-6">
        <div>
          <div className="font-archivo mb-2 text-[24px] leading-normal! font-medium">IP Rights</div>
          <div className="font-archivo text-sm text-neutral-100">
            Select any IP rights that apply and provide supporting documentation
          </div>
        </div>
        <div className="flex w-full flex-col gap-4">
          {OPTIONS_ORDER.map((key) => (
            <ExpandableRightCard
              key={key}
              option={RIGHTS_CONFIG[key]}
              selected={selectedRights.includes(key)}
              onSelect={() => onSelectRight(key)}
              category={category}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
