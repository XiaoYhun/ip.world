"use client"

import { useMutation } from "@tanstack/react-query"
import { getAuthToken } from "@/lib/dynamic"
import { getAPIRootUrl } from "@/lib/utils"

interface FeedbackResponses {
  [key: string]: string | string[]
}

interface BugReportData {
  category: string
  description: string
  steps: string
}

async function postWithAuth(url: string, body: unknown) {
  const token = getAuthToken()
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
            "X-Authorization": `Bearer ${token}`,
          }
        : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function useBetaFeedback() {
  const {
    mutateAsync: submitFeedback,
    isPending: isFeedbackPending,
  } = useMutation({
    mutationFn: (responses: FeedbackResponses) =>
      postWithAuth(`${getAPIRootUrl()}/feedback`, { responses }),
  })

  const {
    mutateAsync: submitBugReport,
    isPending: isBugReportPending,
  } = useMutation({
    mutationFn: (data: BugReportData) =>
      postWithAuth(`${getAPIRootUrl()}/bug-reports`, data),
  })

  return {
    submitFeedback,
    isFeedbackPending,
    submitBugReport,
    isBugReportPending,
  }
}
