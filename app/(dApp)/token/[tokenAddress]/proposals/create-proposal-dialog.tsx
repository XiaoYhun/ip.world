"use client"

import { useState } from "react"
import { parseUnits } from "viem"
import { ArrowLeftRight, Flame, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { useCommunityGovernance, VotingType } from "@/hooks/use-community-governance"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type ProposalAction = "transfer" | "burn" | "swap"

const TITLE_MAX_LENGTH = 35
const DESCRIPTION_MAX_LENGTH = 255

interface CreateProposalDialogProps {
  ip: Ip
  tokenAddress: string
  safeAddress: string
  onClose: () => void
  onCreated: () => void
}

const CreateProposalDialog = ({
  ip,
  tokenAddress,
  safeAddress,
  onClose,
  onCreated,
}: CreateProposalDialogProps) => {
  const { createSpendingProposal } = useCommunityGovernance(ip.id, ip, tokenAddress)

  const [action, setAction] = useState<ProposalAction>("transfer")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    (action !== "transfer" || (recipientAddress.trim().length > 0 && amount.trim().length > 0))

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      // Convert human-readable amount to wei (18 decimals)
      const weiAmount = action === "transfer" ? parseUnits(amount, 18).toString() : "0"

      await createSpendingProposal(
        {
          title,
          description,
          recipientAddress: action === "transfer" ? recipientAddress : "",
          tokenAddress: action === "transfer" ? tokenAddress : "",
          amount: weiAmount,
          votingType: "basic" as VotingType,
          executionIntent:
            action === "transfer"
              ? { type: "transfer", token: tokenAddress, recipient: recipientAddress, amount: weiAmount }
              : undefined,
        },
        safeAddress
      )
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create proposal")
    } finally {
      setSubmitting(false)
    }
  }

  const actions: { key: ProposalAction; label: string; icon: React.ReactNode; disabled?: boolean; badge?: string }[] = [
    { key: "transfer", label: "Transfer", icon: <ArrowLeftRight className="h-6 w-6" /> },
    { key: "burn", label: "Burn", icon: <Flame className="h-6 w-6" /> },
    { key: "swap", label: "Swap", icon: <ArrowRightLeft className="h-6 w-6" />, disabled: true, badge: "COMING SOON" },
  ]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hasCloseButton={false}
        className="!bg-[#121212] !border-[#242424] sm:!max-w-[575px] !rounded-[16px] !p-6"
      >
        <div className="flex flex-col gap-6">
          {/* Title */}
          <h2 className="text-[20px] font-medium text-white">Create A New Proposal</h2>

          {/* Form fields */}
          <div className="flex flex-col gap-4">
            {/* Actions */}
            <div className="flex flex-col gap-4">
              <span className="text-[14px] text-[#494949]">Actions</span>
              <div className="flex gap-4">
                {actions.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => !a.disabled && setAction(a.key)}
                    disabled={a.disabled}
                    className={cn(
                      "relative flex flex-1 flex-col items-center justify-center gap-3 rounded-[16px] border-[0.5px] px-3 py-6 transition-all",
                      a.disabled && "cursor-not-allowed opacity-50",
                      action === a.key && !a.disabled
                        ? "border-[#313131] bg-white text-[#321F4D]"
                        : "border-[#313131] text-white"
                    )}
                    style={{
                      backdropFilter: "blur(10px)",
                      boxShadow: "0px 2px 12px 0px rgba(0,0,0,0.2)",
                    }}
                  >
                    {a.badge && (
                      <span className="absolute right-2 top-2 rounded-[6px] bg-[#C093FF] px-2 py-1 font-mono text-[10px] font-bold text-[#321F4D]">
                        {a.badge}
                      </span>
                    )}
                    {a.icon}
                    <span className="text-[16px] font-semibold">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title input */}
            <div
              className="flex flex-col gap-2 rounded-[12px] border-[0.5px] border-[#313131] p-3"
              style={{ backgroundColor: "rgba(25,25,25,0.7)", backdropFilter: "blur(10px)", boxShadow: "0px 2px 12px 0px rgba(0,0,0,0.2)" }}
            >
              <span className="text-[12px] text-[#494949]">Title</span>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))}
                  placeholder="Brief, descriptive title for this proposal"
                  className="w-full bg-transparent text-[16px] text-white placeholder:text-[#494949] focus:outline-none"
                />
                <span className="shrink-0 font-mono text-[10px] text-[#494949]">
                  {title.length}/{TITLE_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Description textarea */}
            <div
              className="flex min-h-[164px] flex-col justify-between rounded-[12px] border-[0.5px] border-[#313131] p-3"
              style={{ backgroundColor: "rgba(25,25,25,0.7)", backdropFilter: "blur(10px)", boxShadow: "0px 2px 12px 0px rgba(0,0,0,0.2)" }}
            >
              <div className="flex flex-col gap-2">
                <span className="text-[12px] text-[#494949]">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
                  placeholder="Brief, descriptive title for this proposal"
                  rows={4}
                  className="w-full resize-none bg-transparent text-[16px] text-white placeholder:text-[#494949] focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <span className="font-mono text-[10px] text-[#494949]">
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Transfer-specific fields */}
            {action === "transfer" && (
              <div className="flex flex-col gap-3">
                <div
                  className="flex flex-col gap-2 rounded-[12px] border-[0.5px] border-[#313131] p-3"
                  style={{ backgroundColor: "rgba(25,25,25,0.7)", backdropFilter: "blur(10px)" }}
                >
                  <span className="text-[12px] text-[#494949]">Recipient Address</span>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-transparent font-mono text-[16px] text-white placeholder:text-[#494949] focus:outline-none"
                  />
                </div>
                <div
                  className="flex flex-col gap-2 rounded-[12px] border-[0.5px] border-[#313131] p-3"
                  style={{ backgroundColor: "rgba(25,25,25,0.7)", backdropFilter: "blur(10px)" }}
                >
                  <span className="text-[12px] text-[#494949]">Amount</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "" || /^\d*\.?\d*$/.test(val)) setAmount(val)
                    }}
                    placeholder="100"
                    className="w-full bg-transparent font-mono text-[16px] text-white placeholder:text-[#494949] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[#242424]" />

          {/* Error */}
          {error && (
            <div className="rounded-[8px] bg-[#401026] px-3 py-2 text-xs text-[#FF4297]">{error}</div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-[8px] border-[0.5px] border-[#242424] px-6 py-3 text-[14px] font-semibold text-[#494949] transition-colors hover:text-white"
              style={{ boxShadow: "inset 0px 0px 10px 0px rgba(255,255,255,0.25)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className={cn(
                "rounded-[8px] px-6 py-3 text-[14px] font-semibold transition-all",
                isValid && !submitting
                  ? "bg-[#DFCDF9] text-[#321F4D] hover:bg-[#C093FF]"
                  : "cursor-not-allowed bg-[#313131] text-[#494949]"
              )}
              style={{ boxShadow: isValid ? "inset 0px 0px 10px 0px rgba(255,255,255,0.25)" : undefined }}
            >
              {submitting ? "Creating..." : "Create Proposal"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateProposalDialog
