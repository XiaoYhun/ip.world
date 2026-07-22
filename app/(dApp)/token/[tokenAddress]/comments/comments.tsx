"use client"

import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useAccount } from "@/hooks/use-account"
import { createComment as createCommentAction } from "@/actions/comments/create-comment"
import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import { Button } from "@/components/ui/button"
import Spinner from "@/components/ui/spinner"
import { useProfile } from "@/hooks/use-profile"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { getAuthToken } from "@/lib/dynamic"
import { Comment } from "@/types/comment"
import { Remix } from "@/types/remix"
import { User } from "@/types/user"
import CommentList from "./comment-list"

const CommentInput = ({
  user,
  address,
  body,
  setBody,
  handleCreateComment,
}: {
  user: User
  address: string
  body: string
  setBody: (body: string) => void
  handleCreateComment: () => void
}) => {
  return (
    <div className="focus-within:ring-focus flex items-center gap-3 rounded-[8px] border !border-white/10 bg-neutral-700 px-3 py-2 transition-all w-full md:w-auto">
      <Image
        src={user?.avatar_url || defaultUserImage}
        alt={"user-avatar"}
        width={20}
        height={20}
        className="aspect-square h-5 w-5 rounded-full object-cover"
      />
      <input
        className="flex-1 rounded-[10px] border border-neutral-600 bg-transparent p-2 text-sm font-normal placeholder:text-neutral-300 focus:!shadow-none focus:!outline-hidden focus:outline-none md:rounded-none md:border-none md:p-0"
        placeholder="Comment..."
        value={body}
        onChange={(e) => setBody(e.currentTarget.value)}
      />
      <Button
        variant="ghost"
        className="size-6 cursor-pointer rounded-[12px] p-2"
        onClick={handleCreateComment}
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
  )
}

const Comments = ({ remix }: { remix: Remix }) => {
  const { address } = useAccount()
  const isLoggedIn = useIsLoggedIn()
  const { user } = useProfile()
  const queryClient = useQueryClient()

  const queryKey = ["comments", remix.id]

  const { data, error, isLoading } = useQuery<Comment[]>({
    queryKey,
    queryFn: async () => {
      const result = await fetchJSONWithAuth<Comment[]>(`/api/comments?remix_id=${remix.id}`)
      return result ?? []
    },
  })

  const [body, setBody] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const createCommentMutation = useMutation({
    mutationFn: async ({ remix_id, body, user_address }: { remix_id: string; body: string; user_address: string }) => {
      const response = await createCommentAction({ remix_id, body, user_address }, getAuthToken())
      return response
    },
    onMutate: async ({ remix_id, body, user_address }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically update to the new value
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        remix_id,
        body,
        user_address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: user as User,
        replies: [],
      }

      queryClient.setQueryData<Comment[]>(queryKey, (old) => [optimisticComment, ...(old || [])])

      // Return context with the previous value
      return { previousComments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      console.error("Create Comment Error:", err)
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const handleCreateComment = async () => {
    setValidationError(null)
    if (!isLoggedIn || !address) {
      setValidationError("Please connect your wallet before submitting a comment")
      return
    }

    if (!body || body.length === 0) {
      setValidationError("Message cannot be empty!")
      return
    }

    createCommentMutation.mutate({ remix_id: remix.id, body, user_address: address })

    // Clear the input
    setBody("")
  }

  if (error) return <div>No comments yet</div>

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )

  const comments = data || []

  return (
    <div className="flex flex-col gap-4 md:pl-6 md:pr-4 md:pb-4 w-full md:w-auto">
      <div className="flex w-full md:w-auto md:block sticky top-[132px] z-10 bg-background pb-3 md:pt-4 md:-mx-4 md:px-4">
        <CommentInput
          user={user!}
          address={address!}
          body={body}
          setBody={setBody}
          handleCreateComment={handleCreateComment}
        />
      </div>
      {validationError && <span className="text-red pl-3 text-[10px]">{validationError}</span>}
      {comments.length > 0 && remix?.id ? (
        <CommentList data={comments} remixId={remix.id} queryKey={queryKey} />
      ) : (
        <div className="flex items-center justify-center">
          <p className="text-sm text-neutral-300">No comments yet</p>
        </div>
      )}

      <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-600 bg-black p-2 md:hidden">
        <CommentInput
          user={user!}
          address={address!}
          body={body}
          setBody={setBody}
          handleCreateComment={handleCreateComment}
        />
      </div>
    </div>
  )
}

export default Comments
