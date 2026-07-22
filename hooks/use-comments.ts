"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { Comment } from "@/types/comment"
import { ListResponse } from "@/types/response"

const DEFAULT_RESPONSE: ListResponse<Comment> = { results: [], total: 0, limit: 1000, offset: 0 }

function useComments(remixId: string) {
  const {
    data = DEFAULT_RESPONSE,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["comments", remixId],
    queryFn: () => fetchJSONWithAuth<ListResponse<Comment>>(`/api/comments?remix_id=${remixId}`),
    enabled: !!remixId,
  })

  return { data, isLoading, isError: !!error, refetch }
}

export default useComments
