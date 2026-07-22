"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  MessageSquare,
  Bug,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitFeedback?: (responses: FeedbackResponses) => Promise<void> | void
  onSubmitBugReport?: (data: BugReportData) => Promise<void> | void
}

interface FeedbackResponses {
  [key: string]: string | string[]
}

interface BugReportData {
  category: string
  description: string
  steps: string
}

type Tab = "feedback" | "bug-report"

// ── Survey blocks ────────────────────────────────────────────────────────────

const BLOCKS = [
  {
    id: "user-context",
    title: "User Context",
    description: "Help us understand your background",
    questions: [
      {
        id: "user-type",
        question: "How would you describe yourself?",
        type: "single" as const,
        options: ["Trader", "IP owner", "Content creator / Editor", "Other"],
      },
      {
        id: "experience",
        question: "How experienced are you with crypto platforms?",
        type: "single" as const,
        options: [
          "No prior experience",
          "Less than 1 year",
          "1-2 years",
          "3+ years",
        ],
      },
    ],
  },
  {
    id: "first-impression",
    title: "First Impression",
    description: "Your initial experience with ip.world",
    questions: [
      {
        id: "purpose-clarity",
        question:
          "How clear was the purpose of ip.world when you first used the product?",
        type: "single" as const,
        options: ["Very clear", "Clear", "Neutral", "Unclear", "Very unclear"],
      },
      {
        id: "ease-of-start",
        question:
          "How easy was it to get started and understand what to do next?",
        type: "single" as const,
        options: [
          "Very easy",
          "Easy",
          "Neutral",
          "Difficult",
          "Very difficult",
        ],
      },
      {
        id: "confusion",
        question:
          "What, if anything, felt confusing during your first session?",
        type: "text" as const,
        placeholder: "Describe any confusion you experienced...",
      },
    ],
  },
  {
    id: "core-flows",
    title: "Core Product Flows",
    description: "Your experience with key features",
    questions: [
      {
        id: "features-used",
        question: "What features did you use during the beta?",
        type: "multi" as const,
        options: [
          "Token creation",
          "Trading",
          "UGC",
          "Verification",
          "Community IP features",
          "Creator IP features",
        ],
      },
      {
        id: "intuitive",
        question: "How intuitive did the core flows feel?",
        type: "single" as const,
        options: [
          "Very intuitive",
          "Intuitive",
          "Neutral",
          "Confusing",
          "Very confusing",
        ],
      },
      {
        id: "difficult-features",
        question: "Which features were difficult to understand or use?",
        type: "multi" as const,
        options: [
          "Token creation",
          "Trading",
          "UGC",
          "Verification",
          "Community IP features",
          "Creator IP features",
          "None",
        ],
      },
    ],
  },
  {
    id: "performance",
    title: "Performance",
    description: "Platform stability and reliability",
    questions: [
      {
        id: "device",
        question: "What device did you primarily use during the beta?",
        type: "single" as const,
        options: ["Desktop", "Mobile browser", "Both"],
      },
      {
        id: "performance-rating",
        question: "How would you rate the overall performance?",
        type: "single" as const,
        options: ["Excellent", "Good", "Acceptable", "Poor"],
      },
      {
        id: "loading-times",
        question: "Did you experience slow loading times or lag?",
        type: "single" as const,
        options: ["Frequently", "Occasionally", "Rarely", "Never"],
      },
    ],
  },
  {
    id: "incentives",
    title: "Incentives",
    description: "Points system and rewards",
    questions: [
      {
        id: "points-clarity",
        question: "Was the points system easy to understand?",
        type: "single" as const,
        options: ["Very clear", "Clear", "Neutral", "Unclear", "Very unclear"],
      },
      {
        id: "points-motivation",
        question: "Did the points system motivate you to engage more?",
        type: "single" as const,
        options: [
          "Strongly",
          "Somewhat",
          "Neutral",
          "Not really",
          "Not at all",
        ],
      },
      {
        id: "incentive-improvement",
        question: "What would make the incentive system more compelling?",
        type: "text" as const,
        placeholder: "Share your suggestions...",
      },
    ],
  },
  {
    id: "verification",
    title: "Verification",
    description: "Token verification process",
    questions: [
      {
        id: "verification-intuitive",
        question:
          "Was the verification process intuitive and easy to follow?",
        type: "single" as const,
        options: [
          "Very intuitive",
          "Intuitive",
          "Neutral",
          "Confusing",
          "Very confusing",
        ],
      },
      {
        id: "verification-confidence",
        question: "Do you feel more confident buying verified tokens?",
        type: "single" as const,
        options: [
          "Much more confident",
          "Somewhat more confident",
          "Neutral",
          "Not more confident",
        ],
      },
      {
        id: "verification-improvement",
        question: "What would you change in the verification process?",
        type: "text" as const,
        placeholder: "Share your thoughts...",
      },
    ],
  },
  {
    id: "overall",
    title: "Overall Experience",
    description: "Final thoughts and feedback",
    questions: [
      {
        id: "overall-rating",
        question: "How would you rate your experience using ip.world V3?",
        type: "single" as const,
        options: ["Excellent", "Good", "Acceptable", "Poor", "Very poor"],
      },
      {
        id: "launch-ready",
        question: "Do you feel the platform is ready for public launch?",
        type: "single" as const,
        options: [
          "Yes, fully ready",
          "Almost ready (minor improvements needed)",
          "Not yet (significant improvements required)",
        ],
      },
      {
        id: "most-important",
        question:
          "What is the single most important improvement we should make before launch?",
        type: "text" as const,
        placeholder: "Share your most important suggestion...",
      },
      {
        id: "liked-most",
        question: "What did you like most about the product?",
        type: "text" as const,
        placeholder: "Tell us what you loved...",
      },
      {
        id: "frustrated-most",
        question: "What frustrated you the most?",
        type: "text" as const,
        placeholder: "Tell us what needs improvement...",
      },
    ],
  },
]

const BUG_CATEGORIES = [
  "UI/Display Issue",
  "Transaction Error",
  "Wallet Connection",
  "Performance",
  "Other",
]

const FEEDBACK_SUBMITTED_KEY = "v3-beta-feedback-submitted"

// ── Feedback tab ─────────────────────────────────────────────────────────────

function FeedbackTab({
  onSubmit,
  onClose,
}: {
  onSubmit?: (responses: FeedbackResponses) => Promise<void> | void
  onClose: () => void
}) {
  const [currentBlock, setCurrentBlock] = useState(0)
  const [responses, setResponses] = useState<FeedbackResponses>({})
  const [submitted, setSubmitted] = useState(() => {
    try {
      return localStorage.getItem(FEEDBACK_SUBMITTED_KEY) === "true"
    } catch {
      return false
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const block = BLOCKS[currentBlock]
  const isLastBlock = currentBlock === BLOCKS.length - 1
  const isFirstBlock = currentBlock === 0

  const handleSingleSelect = useCallback(
    (questionId: string, value: string) => {
      setResponses((prev) => ({ ...prev, [questionId]: value }))
    },
    [],
  )

  const handleMultiSelect = useCallback(
    (questionId: string, value: string) => {
      setResponses((prev) => {
        const current = (prev[questionId] as string[]) || []
        if (current.includes(value)) {
          return { ...prev, [questionId]: current.filter((v) => v !== value) }
        }
        return { ...prev, [questionId]: [...current, value] }
      })
    },
    [],
  )

  const handleTextChange = useCallback(
    (questionId: string, value: string) => {
      setResponses((prev) => ({ ...prev, [questionId]: value }))
    },
    [],
  )

  const handleNext = useCallback(async () => {
    if (isLastBlock) {
      try {
        setIsSubmitting(true)
        await onSubmit?.(responses)
        try {
          localStorage.setItem(FEEDBACK_SUBMITTED_KEY, "true")
        } catch {}
        setSubmitted(true)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit feedback"
        toast.error(message)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setCurrentBlock((prev) => prev + 1)
    }
  }, [isLastBlock, onSubmit, responses])

  const handleBack = useCallback(() => {
    if (!isFirstBlock) {
      setCurrentBlock((prev) => prev - 1)
    }
  }, [isFirstBlock])

  const isBlockComplete = block.questions.every((q) => {
    const response = responses[q.id]
    if (q.type === "text") return true
    if (q.type === "multi") return Array.isArray(response) && response.length > 0
    return !!response
  })

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-purple-300/20 flex items-center justify-center mb-5">
          <Check className="w-7 h-7 text-purple-300" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Thank you!
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Your feedback has been submitted. Points will be credited after review.
        </p>
        <button
          onClick={onClose}
          className="cursor-pointer px-6 py-2.5 rounded-xl bg-purple-300 text-sm font-medium text-white hover:bg-purple-300/90 transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="h-[520px] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-start gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-300/20 text-purple-300">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {block.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {block.description}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4 shrink-0">
        <div className="flex gap-1.5">
          {BLOCKS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= currentBlock ? "bg-purple-300" : "bg-border",
              )}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Block {currentBlock + 1} of {BLOCKS.length}
        </p>
      </div>

      {/* Questions */}
      <div className="px-5 flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-5 pb-4">
          {block.questions.map((q) => (
            <div key={q.id} className="flex flex-col gap-2.5">
              <p className="text-sm text-foreground">{q.question}</p>

              {q.type === "single" && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSingleSelect(q.id, option)}
                      className={cn(
                        "cursor-pointer px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                        responses[q.id] === option
                          ? "bg-purple-300/20 border-purple-300/50 text-purple-200"
                          : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "multi" && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((option) => {
                    const selected = (
                      (responses[q.id] as string[]) || []
                    ).includes(option)
                    return (
                      <button
                        key={option}
                        onClick={() => handleMultiSelect(q.id, option)}
                        className={cn(
                          "cursor-pointer px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                          selected
                            ? "bg-purple-300/20 border-purple-300/50 text-purple-200"
                            : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
                        )}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === "text" && (
                <textarea
                  value={(responses[q.id] as string) || ""}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full h-20 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-purple-300/50 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-5 pt-4 flex gap-3 shrink-0">
        {!isFirstBlock && (
          <button
            onClick={handleBack}
            className="cursor-pointer flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!isBlockComplete || isSubmitting}
          className={cn(
            "flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
            isBlockComplete && !isSubmitting
              ? "cursor-pointer bg-purple-300 text-white hover:bg-purple-300/90"
              : "bg-secondary text-muted-foreground cursor-not-allowed",
          )}
        >
          {isSubmitting ? "Submitting..." : isLastBlock ? "Submit Feedback" : "Continue"}
          {!isLastBlock && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ── Bug report tab ───────────────────────────────────────────────────────────

function BugReportTab({
  onSubmit,
  onClose,
}: {
  onSubmit?: (data: BugReportData) => Promise<void> | void
  onClose: () => void
}) {
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [steps, setSteps] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!category || !description.trim()) return
    try {
      setIsSubmitting(true)
      await onSubmit?.({ category, description, steps })
      setSubmitted(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit bug report"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = category && description.trim().length >= 10

  if (submitted) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-purple-300/20 flex items-center justify-center mb-4">
          <Check className="w-6 h-6 text-purple-300" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2">
          Bug Report Submitted
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Thank you for helping us improve. We&apos;ll look into this issue.
        </p>
        <button
          onClick={onClose}
          className="cursor-pointer px-6 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="h-[520px] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-start gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/20 text-destructive">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Report a Bug
            </h2>
            <p className="text-xs text-muted-foreground">
              Help us squash bugs by describing what went wrong
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-4 pb-4">
          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {BUG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "cursor-pointer px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                    category === cat
                      ? "bg-purple-300/20 border-purple-300/50 text-purple-200"
                      : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">
              What happened? <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bug..."
              className="w-full h-24 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-purple-300/50 transition-colors"
            />
          </div>

          {/* Steps to reproduce */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">
              Steps to reproduce (optional)
            </label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={"1. Go to...\n2. Click on...\n3. See error"}
              className="w-full h-20 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-purple-300/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="p-5 pt-4 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={cn(
            "w-full py-3.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
            isValid && !isSubmitting
              ? "cursor-pointer bg-purple-300 text-white hover:bg-purple-300/90"
              : "bg-secondary/50 text-muted-foreground cursor-not-allowed",
          )}
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "feedback", label: "Feedback" },
  { id: "bug-report", label: "Bug Report" },
]

export default function FeedbackModal({
  open,
  onOpenChange,
  onSubmitFeedback,
  onSubmitBugReport,
}: FeedbackModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("feedback")

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setTimeout(() => {
      setActiveTab("feedback")
    }, 300)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        hasCloseButton={false}
        className="sm:max-w-lg p-0 bg-card dark:bg-card border-border overflow-hidden gap-0 rounded-2xl"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="cursor-pointer absolute top-3 right-4 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title + Tab switcher */}
        <div className="px-5 pt-5 pb-0 shrink-0">
          <h2 className="text-base font-semibold text-foreground mb-1">V3 Beta Program</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Help us improve ip.world. Share your feedback and earn points
          </p>
          <div className="flex gap-1 rounded-[10px] border border-border p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "cursor-pointer flex h-[32px] flex-1 items-center justify-center rounded-[8px] text-sm transition-all",
                  activeTab === tab.id
                    ? "bg-purple-300 font-semibold text-white"
                    : "font-medium text-muted-foreground hover:bg-secondary/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "feedback" && (
          <FeedbackTab onSubmit={onSubmitFeedback} onClose={handleClose} />
        )}
        {activeTab === "bug-report" && (
          <BugReportTab onSubmit={onSubmitBugReport} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
