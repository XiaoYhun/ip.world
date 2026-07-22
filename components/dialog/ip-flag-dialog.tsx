import { ReactNode, useState } from "react"
import { toast } from "sonner"
import { useAccount } from "@/hooks/use-account"
import { sendVote } from "@/actions/vote/send-vote"
import SocialSelect from "@/components/social-select"
import { SOCIAL_TYPE } from "@/components/socials"
import { Button } from "@/components/ui/button"
import { getAuthToken } from "@/lib/dynamic"
import { Ip } from "@/types/ip"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

const IpFlagDialog = ({
  trigger,
  ip,
  suggestionId,
  onVoteSubmitted,
}: {
  trigger: ReactNode
  ip: Ip
  suggestionId: string
  onVoteSubmitted?: () => void
}) => {
  const { address } = useAccount()

  const [reason, setReason] = useState<string>("invalid_link")
  const [socialType, setSocialType] = useState<SOCIAL_TYPE>(SOCIAL_TYPE.TWITTER)
  const [social, setSocial] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async () => {
    if (!address) return

    setIsSubmitting(true)
    try {
      const result = await sendVote(
        {
          is_valid: false,
          user_address: address,
          ip_id: ip.id,
          reason,
          account: social,
          account_type: socialType,
          suggestion_id: suggestionId,
        },
        getAuthToken()
      )

      // Check if the result indicates an error
      if (result && result.error) {
        throw new Error(result.error)
      }

      toast.success("Flag submitted successfully")
      setIsOpen(false)
      // Reset form
      setReason("invalid_link")
      setSocial("")
      setSocialType(SOCIAL_TYPE.TWITTER)

      // Notify parent component to refresh data
      onVoteSubmitted?.()
    } catch (error) {
      console.error("Error flagging:", error)

      // Handle specific error messages
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      if (errorMessage.includes("failed to insert suggestion vote")) {
        toast.error("You have already voted on this suggestion")
      } else if (errorMessage.includes("suggestion not found")) {
        toast.error("This suggestion no longer exists")
      } else {
        toast.error("Failed to submit flag")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!bg-black sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            <span className="flex flex-col gap-2">
              <span className="text-md font-semibold">IP Owner</span>
              <span className="text-md font-semibold">{ip.owner_account || "-"}</span>
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 border-b px-4 py-6">
          <div className="space-y-2">
            <p className="text-neutral-200 mb-3 text-sm font-medium">Reason</p>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-8 w-full cursor-pointer">
                <SelectValue placeholder="Select Reason" />
              </SelectTrigger>
              <SelectContent className="w-full bg-black">
                <SelectItem className="w-full cursor-pointer" value="invalid_link">
                  Invalid Link
                </SelectItem>
                <SelectItem className="w-full cursor-pointer" value="wrong_owner">
                  Wrong Owner
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-neutral-200 mb-3 text-sm font-medium">Enter Social (optional)</p>
            <SocialSelect value={social} onValueChange={setSocial} type={socialType} onTypeChange={setSocialType} />
          </div>
        </div>
        <DialogFooter className="px-5 py-4">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full text-sm font-medium">
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default IpFlagDialog
