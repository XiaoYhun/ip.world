import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { Dispatch, SetStateAction, useState } from "react"
import { Address } from "viem"
import { useAccount } from "@/hooks/use-account"
import { createReply as createReplyAction } from "@/actions/comments/create-reply"
import ReportDialog from "@/components/dialog/report-dialog"
import { ChevronDown } from "@/components/icons"
import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import Timer from "@/components/timer"
import { Button } from "@/components/ui/button"
import { useProfile } from "@/hooks/use-profile"
import { getAuthToken } from "@/lib/dynamic"
import { cn } from "@/lib/utils"
import { Comment } from "@/types/comment"
// Flag icon removed — report is now text-only next to timestamp
import { User } from "@/types/user"

const CommentBox = ({
  data,
  isComment,
  body,
  setBody,
  validationError,
  replyLength,
  isOpen = false,
  toggleOpen,
  handleCreateReply,
}: {
  data: Comment
  isComment: boolean
  validationError?: string | null
  replyLength?: number
  body?: string
  setBody?: Dispatch<SetStateAction<string>>
  isOpen?: boolean
  toggleOpen?: () => void
  handleCreateReply?: () => Promise<void>
}) => {
  const { address } = useAccount()
  const { user } = useProfile()
  const [showReplyInput, setShowReplyInput] = useState(false)

  const toggleReplyInput = () => {
    setShowReplyInput(!showReplyInput)
    // Clear the input when hiding
    if (showReplyInput && setBody) {
      setBody("")
    }
  }

  return (
    <div className="py-2">
      <div className="flex items-start gap-2">
        {data?.user ? (
          <Image
            src={data?.user?.avatar_url || defaultUserImage}
            alt={"user avatar"}
            width={36}
            height={36}
            className="aspect-square h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <Image
            src={defaultUserImage}
            alt={"user avatar"}
            width={36}
            height={36}
            className="aspect-square h-8 w-8 rounded-full object-cover"
          />
        )}

        <div className="flex w-full flex-col gap-1">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Link href={`/@${data?.user?.username || data.user_address}`}>
              {data?.user ? (
                <p className="text-sm hover:underline">@{data.user.username}</p>
              ) : (
                <p className="text-sm hover:underline">{data.user_address?.slice(0, 8)}...</p>
              )}
            </Link>
            <div className="text-xs whitespace-nowrap text-neutral-300">
              <Timer startTime={new Date(data.created_at).toString()} /> ago
            </div>
            <ReportDialog
              topic="comment"
              id={data.id}
              trigger={
                <span className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-300">report</span>
              }
            />
          </div>
          <p className="text-sm font-normal break-words text-neutral-100">{data.body}</p>
          {isComment && (
            <div className="mt-2 flex w-full flex-col items-start gap-2 pr-1">
              <div className="flex items-center gap-4">
                <div
                  className={cn("hidden cursor-pointer items-center gap-1", { flex: replyLength !== 0 })}
                  onClick={toggleOpen}
                >
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={12} />
                  </motion.div>
                  <div className="text-sm font-medium">{replyLength} replies</div>
                </div>
                <span
                  className={cn(
                    "cursor-pointer text-sm font-medium text-neutral-300 hover:text-white",
                    showReplyInput && "!text-neutral-100"
                  )}
                  onClick={toggleReplyInput}
                >
                  reply
                </span>
              </div>

              <AnimatePresence>
                {showReplyInput && (
                  <motion.div
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="focus-within:ring-focus relative w-full flex-1 overflow-hidden rounded-[8px] border border-neutral-600 bg-neutral-800"
                  >
                    <div className="flex w-full items-center gap-1.5 px-3 py-2 md:gap-4">
                      <Image
                        src={user?.avatar_url || defaultUserImage}
                        alt={"user-avatar"}
                        width={20}
                        height={20}
                        className="aspect-square h-5 w-5 rounded-full object-cover"
                      />
                      <input
                        className="flex-1 bg-transparent text-sm font-normal placeholder:text-neutral-300 focus:!shadow-none focus:outline-hidden"
                        placeholder="Type your reply here..."
                        value={body}
                        onChange={(e) => setBody && setBody(e.currentTarget.value)}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        className="size-6 cursor-pointer rounded-[12px] p-2"
                        onClick={handleCreateReply}
                        disabled={!body || body.length === 0 || !address}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <g clipPath="url(#clip0_71_14165)">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M15.449 1.58363L15.9225 0.0667114L14.4054 0.539797L1.37608 4.60303L0.0774536 5.00801L1.02814 5.98097L4.2336 9.26158V15.7954L5.62496 14.5409L7.7039 12.6665L9.99617 14.9588L10.9704 15.933L11.381 14.6178L15.449 1.58363ZM5.19408 7.85971L3.1709 5.78915L13.3846 2.60398L10.2004 12.806L8.32284 10.9284L7.7633 10.3688L7.17557 10.8988L5.90027 12.0486V9.38378L10.8419 6.29527L9.95857 4.88193L5.19408 7.85971Z"
                              fill="currentColor"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_71_14165">
                              <rect width="16" height="16" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </Button>
                    </div>
                    {validationError && (
                      <motion.span
                        className="text-red pl-3 text-[10px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {validationError}
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {/* Report for replies is shown next to the timestamp above */}
        </div>
      </div>
    </div>
  )
}

const CommentItem = ({
  comments,
  data,
  remixId,
  queryKey,
}: {
  comments: Comment[]
  data: Comment
  remixId: string
  queryKey: string[]
}) => {
  const { address } = useAccount()
  const isLoggedIn = useIsLoggedIn()
  const { user } = useProfile()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [body, setBody] = useState("")

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  const [validationError, setValidationError] = useState<string | null>(null)

  const createReplyMutation = useMutation({
    mutationFn: async ({
      remix_id,
      body,
      user_address,
      parent_id,
    }: {
      remix_id: string
      body: string
      user_address: string
      parent_id: string
    }) => {
      const response = await createReplyAction({ remix_id, body, user_address, parent_id }, getAuthToken())
      return response
    },
    onMutate: async ({ remix_id, body, user_address, parent_id }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically update to the new value
      const optimisticReply: Comment = {
        id: `temp-${Date.now()}`,
        remix_id,
        body,
        user_address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: user as User,
        replies: [],
      }

      queryClient.setQueryData<Comment[]>(queryKey, (old) =>
        old?.map((comment) => {
          if (comment.id === parent_id) {
            const replies = comment?.replies || []
            return {
              ...comment,
              replies: [optimisticReply, ...replies],
            }
          }
          return comment
        })
      )

      // Return context with the previous value
      return { previousComments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      console.error("Create Reply Error:", err)
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const handleCreateReply = async () => {
    setValidationError(null)
    if (!isLoggedIn || !address) {
      setValidationError("Please connect your wallet before submitting a comment")
      return
    }

    if (!body || body.length === 0) {
      setValidationError("Message cannot be empty!")
      return
    }

    createReplyMutation.mutate({
      remix_id: remixId,
      body,
      user_address: address,
      parent_id: data.id,
    })

    // Clear the input
    setBody("")
  }

  return (
    <div className="mb-4">
      <CommentBox
        data={data}
        isComment={true}
        isOpen={isOpen}
        toggleOpen={toggleOpen}
        body={body}
        setBody={setBody}
        replyLength={data.replies?.length || 0}
        validationError={validationError}
        handleCreateReply={handleCreateReply}
      />

      <AnimatePresence>
        {isOpen && data.replies?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.2 },
                opacity: { duration: 0.1, delay: 0.1 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.2 },
                opacity: { duration: 0.1 },
              },
            }}
            className="ms-10 overflow-hidden pt-1"
          >
            {data.replies?.map((reply: Comment, index: number) => (
              <motion.div
                key={"reply" + reply.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CommentBox data={reply} isComment={false} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CommentItem
