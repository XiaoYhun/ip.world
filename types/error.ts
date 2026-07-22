export interface ErrResponse {
  error: string
  status: number
}

export function isErrResponse(response: any): response is ErrResponse {
  return response && typeof response === "object" && "error" in response && "status" in response
}
