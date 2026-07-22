export type ListResponse<T> = {
  total: number
  limit: number
  offset: number
  results: T[]
}

export type UploadFileResponse = {
  url: string
  object_url: string
  content_type?: string
}

export type ActionResponse<T> = {
  success: boolean
  data?: T
  message?: string
}
