"use client"
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { Loader2 } from "lucide-react"
import { ReactNode, useEffect, useState } from "react"
import { toast } from "sonner"
import Image from "@/components/image"
import { Button } from "@/components/ui/button"
import useDebounce from "@/hooks/use-debounce"
import { useRemixes } from "@/hooks/use-remixes"
import { useReport } from "@/hooks/use-report"
import useSearchIp from "@/hooks/use-search-ip"
import { Ip } from "@/types/ip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { Community, Creator } from "../icons"

const ReportDialog = ({
  topic,
  trigger,
  id,
  ip,
  currentIpId,
  feedType,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  topic: "ip" | "take" | "feed" | "token" | "comment"
  trigger?: ReactNode
  id: string
  ip?: Ip
  currentIpId?: string
  feedType?: "tiktok" | "x"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const isControlled = openProp !== undefined
  const [reason, setReason] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [selectedIp, setSelectedIp] = useState<string>("")
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [ipName, setIpName] = useState<string>("")
  const [owner, setOwner] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? openProp! : internalOpen
  // Add state for duplicate IP search
  const [duplicateIpName, setDuplicateIpName] = useState<string>("")
  const [selectedDuplicateIp, setSelectedDuplicateIp] = useState<string>("")

  // Add Dynamic auth hooks
  const isLoggedIn = useIsLoggedIn()
  const { setShowAuthFlow } = useDynamicContext()

  // Handle opening the dialog with auth check
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !isLoggedIn) {
      setShowAuthFlow(true)
      return
    }
    if (isControlled) {
      onOpenChangeProp?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const ipSearchTerm = useDebounce(ipName, 500)
  // Add debounced search for duplicate IP
  const duplicateIpSearchTerm = useDebounce(duplicateIpName, 500)
  const ipSearchResult = useSearchIp(ipSearchTerm)
  // Filter out current IP for token wrong IP reports
  const ips = (ipSearchResult.data || []).filter((searchIp) => {
    if (topic === "token" && reason === "wrong_ip" && currentIpId) {
      return searchIp.id !== currentIpId
    }
    return true
  })
  const isLoading = ipSearchResult.isLoading
  // Add search for duplicate IPs - be explicit about the structure
  const duplicateIpSearchResult = useSearchIp(duplicateIpSearchTerm)
  const duplicateIps = (duplicateIpSearchResult.data || []).filter((duplicateIp) => duplicateIp.id !== id)
  const isLoadingDuplicateIps = duplicateIpSearchResult.isLoading

  const { reportIp } = useReport()

  // Get remixes for the specific IP being reported
  const { remixes, isLoading: isLoadingRemixes } = useRemixes(ip?.id || "", "market_cap", "desc")

  const handleReportIp = async () => {
    setIsSubmitting(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req: any = {
      entity: topic === "feed" && feedType ? `${feedType}_feed` : topic,
      entity_id: id,
      type: reason,
    }

    if (topic === "ip") {
      if (reason === "duplicate_ip") {
        const metadata = {
          duplicate_ip_id: selectedDuplicateIp,
          description: description,
        }
        req.metadata = metadata
      } else if (reason === "wrong_owner") {
        const metadata = {
          owner: owner,
          description: description,
        }
        req.metadata = metadata
      } else if (reason === "ip_type_incorrect") {
        const metadata =
          ip?.type === "creator"
            ? {
              token_id: selectedToken,
              description: description,
            }
            : {
              description: description,
            }
        req.metadata = metadata
        req.type = "wrong_type" // Use wrong_type for API call
      } else if (reason === "content") {
        const metadata = {
          description: description,
        }
        req.metadata = metadata
      } else if (reason === "spam") {
        const metadata = {
          description: description,
        }
        req.metadata = metadata
      }
    } else if (topic === "take" || topic === "comment") {
      if (reason === "spam") {
        const metadata = {
          description: description,
        }
        req.metadata = metadata
      } else if (reason === "content") {
        const metadata = {
          description: description,
        }
        req.metadata = metadata
      }
    } else if (topic === "token") {
      if (reason === "wrong_ip") {
        const metadata = {
          ip_id: selectedIp,
          description: description,
        }
        req.metadata = metadata
      } else if (reason === "wrong_type") {
        const metadata = {
          description: description,
        }
        req.metadata = metadata
      } else if (reason === "content") {
        const metadata = {
          description: description,
        }
        req.metadata = metadata
      } else if (reason === "spam") {
        const metadata = {
          description: description,
        }
        req.metadata = metadata
      } else if (reason === "irrelevancy") {
        const metadata = {
          description: description,
        }
        req.metadata = metadata
      }
    } else if (topic === "feed") {
      const metadata = {
        description: description,
      }
      req.metadata = metadata
    }

    try {
      const res = await reportIp(req)

      if (!res.success) {
        toast.error("Failed to submit report.")
        return
      }
      toast.success("Report submitted successfully! Thank you for helping keep the community safe.")
      handleOpenChange(false)
    } catch {
      toast.error("Failed to submit report.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetState() {
    setReason("")
    setDescription("")
    setSelectedIp("")
    setSelectedToken("")
    setIpName("")
    setOwner("")
    setIsSubmitting(false)
    // Reset duplicate IP state
    setDuplicateIpName("")
    setSelectedDuplicateIp("")
  }

  useEffect(() => {
    resetState()
  }, [open])

  const disableButton = () => {
    if (isSubmitting || reason === "") {
      return true
    }
    if (topic === "ip") {
      if (reason === "duplicate_ip") {
        if (selectedDuplicateIp === "") return true
      } else if (reason === "wrong_owner") {
        if (owner === "") return true
      } else if (reason === "ip_type_incorrect" && ip?.type === "creator") {
        if (selectedToken === "") return true
      }
      return false
    } else if (topic === "token") {
      if (reason === "wrong_ip") {
        if (selectedIp === "") return true
      }
    }
    return false
  }

  const getReportOptions = () => {
    if (topic !== "ip" || !ip) {
      return reportsMenu[topic] || []
    }

    // Base options for all IPs
    const baseOptions = [
      {
        key: "duplicate_ip",
        text: "Duplicate IP",
      },
      {
        key: "content",
        text: "Inappropriate content",
      },
      {
        key: "spam",
        text: "Spam",
      },
    ]

    // Add "IP Type Incorrect" only if the IP hasn't been registered (no ipa_id)
    if (!ip.ipa_id) {
      baseOptions.splice(1, 0, {
        key: "ip_type_incorrect",
        text: "IP Type Incorrect",
      })
    }

    // Add "Wrong Owner" only for creator IPs
    if (ip.type === "creator") {
      const insertIndex = !ip.ipa_id ? 3 : 2 // Adjust index based on whether ip_type_incorrect is present
      baseOptions.splice(insertIndex, 0, {
        key: "wrong_owner",
        text: "Wrong Owner",
      })
    }

    return baseOptions
  }

  const reportsMenu = {
    ip: [],
    take: [
      {
        key: "spam",
        text: "Spam",
      },
      {
        key: "content",
        text: "Inappropriate content",
      },
    ],
    feed: [
      {
        key: "off_topic",
        text: "Off topic",
      },
      {
        key: "content",
        text: "Inappropriate content",
      },
    ],
    token: [
      {
        key: "wrong_ip",
        text: "Wrong IP",
      },
      {
        key: "irrelevancy",
        text: "Irrelevancy",
      },
      {
        key: "spam",
        text: "Spam",
      },
      {
        key: "content",
        text: "Inappropriate content",
      },
    ],
    comment: [
      {
        key: "spam",
        text: "Spam",
      },
      {
        key: "content",
        text: "Inappropriate content",
      },
    ],
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="!bg-black sm:max-w-[533px]"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <DialogHeader>
          <DialogTitle>
            <div className="text-md font-semibold">Report</div>
          </DialogTitle>
          <DialogDescription>
            Report inappropriate content or behavior to help keep the community safe.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col border-b px-4 py-6">
          <div className="text-neutral-200 mb-3 text-sm font-medium">What is the purpose of the Report?</div>
          <div className="mb-8">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-8 w-full cursor-pointer">
                <SelectValue className="text-red" placeholder="Select Reason" />
              </SelectTrigger>
              <SelectContent className="w-full bg-black">
                {getReportOptions().map((report) => {
                  return (
                    <SelectItem key={report.key} className="w-full cursor-pointer" value={report.key}>
                      {report.text}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          {reason === "wrong_ip" && topic === "token" && (
            <>
              <div className="text-neutral-200 mb-3 text-sm font-medium">Search For Correct IP</div>
              <Input
                name="correct-ip"
                id="correct-ip"
                required
                placeholder="IP"
                className="mb-6"
                value={ipName}
                onChange={(e) => {
                  setIpName(e.target.value)
                }}
              />
              <div className="virtualized mb-6 flex max-h-[11.0625rem] min-h-[11.0625rem] flex-col gap-3.5 overflow-y-auto rounded-[10px] border bg-[#0D0D0D] p-1">
                {isLoading && (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="text-brand h-6 w-6 animate-spin" />
                  </div>
                )}
                {ips.map((opt) => {
                  return (
                    <div
                      onClick={() => {
                        setSelectedIp(opt.id)
                        setIpName(opt.title)
                      }}
                      key={opt.id}
                      className={`${selectedIp === opt.id && "!bg-neutral-600"} hover:bg-neutral-2000 flex w-full cursor-pointer items-center justify-start gap-2 rounded-[10px] p-1`}
                    >
                      <Image
                        src={opt.image}
                        alt={opt.id}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-[6px] object-cover"
                      />
                      <div className="flex flex-col gap-1">
                        <div>{opt.title}</div>
                        <div className="flex items-start justify-center gap-2">
                          {opt.type === "creator" ? (
                            <div className="text-brand">
                              <Creator size={13} />
                            </div>
                          ) : (
                            <Community width={13} height={10} />
                          )}
                          <div className="text-neutral-200 text-xs font-medium">${opt.handle}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {!isLoading && ips.length === 0 && (
                  <div className="flex h-full w-full items-center justify-center text-neutral-300">No ips found.</div>
                )}
              </div>
            </>
          )}
          {reason === "duplicate_ip" && topic === "ip" && (
            <>
              <div className="text-neutral-200 mb-3 text-sm font-medium">Search For Original IP</div>
              <Input
                name="duplicate-ip"
                id="duplicate-ip"
                required
                placeholder="Original IP"
                className="mb-6"
                value={duplicateIpName}
                onChange={(e) => {
                  setDuplicateIpName(e.target.value)
                }}
              />
              <div className="virtualized mb-6 flex max-h-[11.0625rem] min-h-[11.0625rem] flex-col gap-3.5 overflow-y-auto rounded-[10px] border bg-[#0D0D0D] p-1">
                {isLoadingDuplicateIps && (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="text-brand h-6 w-6 animate-spin" />
                  </div>
                )}
                {duplicateIps.map((opt) => {
                  return (
                    <div
                      onClick={() => {
                        setSelectedDuplicateIp(opt.id)
                        setDuplicateIpName(opt.title)
                      }}
                      key={opt.id}
                      className={`${selectedDuplicateIp === opt.id && "!bg-neutral-600"} hover:bg-neutral-2000 flex w-full cursor-pointer items-center justify-start gap-2 rounded-[10px] p-1`}
                    >
                      <Image
                        src={opt.image}
                        alt={opt.id}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-[6px] object-cover"
                      />
                      <div className="flex flex-col gap-1">
                        <div>{opt.title}</div>
                        <div className="flex items-start justify-center gap-2">
                          {opt.type === "creator" ? (
                            <div className="text-brand">
                              <Creator size={13} />
                            </div>
                          ) : (
                            <Community width={13} height={10} />
                          )}
                          <div className="text-neutral-200 text-xs font-medium">${opt.handle}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {!isLoadingDuplicateIps && duplicateIps.length === 0 && (
                  <div className="flex h-full w-full items-center justify-center text-neutral-300">No ips found.</div>
                )}
              </div>
            </>
          )}
          {reason === "ip_type_incorrect" && topic === "ip" && ip?.type === "creator" && (
            <>
              <div className="text-neutral-200 mb-3 text-sm font-medium">What is the Canonical Community Token</div>
              <div className="virtualized mb-6 flex max-h-[11.0625rem] min-h-[11.0625rem] flex-col gap-3.5 overflow-y-auto rounded-[10px] border bg-[#0D0D0D] p-1">
                {isLoadingRemixes && (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="text-brand h-6 w-6 animate-spin" />
                  </div>
                )}
                {remixes &&
                  remixes.map((remix) => {
                    return (
                      <div
                        onClick={() => {
                          setSelectedToken(remix.id)
                        }}
                        key={remix.id}
                        className={`${selectedToken === remix.id && "!bg-neutral-600"} hover:bg-neutral-2000 flex w-full cursor-pointer items-center justify-start gap-2 rounded-[10px] p-1`}
                      >
                        <Image
                          src={remix.image}
                          alt={remix.id}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-[6px] object-cover"
                        />
                        <div className="flex flex-col gap-1">
                          <div>{remix.name}</div>
                          <div className="flex items-start justify-center gap-2">
                            <div className="text-neutral-200 text-xs font-medium">${remix.symbol}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {!isLoadingRemixes && (!remixes || remixes.length === 0) && (
                  <div className="flex h-full w-full items-center justify-center text-neutral-300">
                    No tokens found for this IP.
                  </div>
                )}
              </div>
            </>
          )}
          {reason === "ip_type_incorrect" && topic === "ip" && ip?.type === "community" && (
            <>
              <div className="text-neutral-200 mb-3 text-sm font-medium">
                Please confirm that this Community IP should be changed to a Creator IP.
              </div>
            </>
          )}
          {reason === "wrong_owner" && (
            <>
              <div className="text-neutral-200 mb-3 text-sm font-medium">IP Owner Social Link</div>
              <Input
                name="social-link"
                id="social-link"
                required
                placeholder="Social Link"
                className="mb-6"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
            </>
          )}
          <div className="text-neutral-200 mb-3 text-sm font-medium">Details (Optional)</div>
          <Textarea
            label="ip description *"
            name="description"
            id="description"
            wrapperclassname="flex-1"
            className="h-[7.5rem] flex-1"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter className="px-5 py-4">
          <Button
            variant="destructive"
            onClick={handleReportIp}
            className="w-fit rounded-[12px] text-sm font-medium"
            disabled={disableButton()}
          >
            Report {topic.charAt(0).toUpperCase() + topic.slice(1)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReportDialog
