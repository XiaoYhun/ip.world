import { useState } from "react"
import { VerificationFormData } from "../form-types"
import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { getAPIRootUrl } from "@/lib/utils"

interface FormSubmissionResponse {
  id: string
  form_data: Record<string, any>
  files: Array<{
    filename: string
    url: string
    size: number
    content_type: string
  }>
  created_at: string
  updated_at: string
}

export function useFormSubmission() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FormSubmissionResponse | null>(null)

  const submit = async (formData: VerificationFormData, ipId: string) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      // Prepare multipart form data
      const formDataToSend = new FormData()

      // Add required ip_id field
      formDataToSend.append("ip_id", ipId)

      // Extract files from form data
      const files = formData.uploaded_documents || []
      const { uploaded_documents, terms_launchpad_agreed, terms_pil_agreed, ...restFormData } = formData

      // Add form data as JSON string (excluding UI-only fields)
      formDataToSend.append("form_data", JSON.stringify(restFormData))

      // Add files with proper field names
      files.forEach((file) => {
        formDataToSend.append("document", file, file.name)
      })

      // Get auth token
      const token = getAuthToken()

      if (!token) {
        throw new Error("Authentication required. Please connect your wallet.")
      }

      // Make API request to new endpoint
      const response = await fetch(`${getAPIRootUrl()}/forms/submit`, {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Submission failed"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, error, data }
}
