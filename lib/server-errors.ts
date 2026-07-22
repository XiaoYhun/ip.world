import "server-only"

import { HttpStatus } from "@/lib/http-utils"
import { logger } from "@/lib/logger"
import { ErrResponse } from "@/types/error"

export enum ErrorMessages {
  GENERIC = "An error occurred on the server, please try again later",
  USERNAME_OR_PASSWORD_REQUIRED = "Username or password are required",
}

export const ErrHandler = {
  async handleBadRequestError(errorMessage: string, context: Record<string, unknown>) {
    return errResponse(HttpStatus.BAD_REQUEST, errorMessage || ErrorMessages.GENERIC, context)
  },

  async handleInvalidInputError(missingFields: string[], context: Record<string, unknown>) {
    const errorMessage = `The following fields are required: ${missingFields.join(", ")}`
    return errResponse(HttpStatus.UNPROCESSABLE_ENTITY, errorMessage, context)
  },

  async handleGenericError(error: unknown, context: Record<string, unknown>) {
    if (!(error instanceof Error)) {
      return errResponse(HttpStatus.INTERNAL_SERVER_ERROR, `Unexpected non-error thrown: ${error}`, context)
    }
    const errorMessage = error.message || ErrorMessages.GENERIC
    if (error instanceof SyntaxError) {
      return errResponse(HttpStatus.INTERNAL_SERVER_ERROR, `JSON Parse Error: ${errorMessage}`, context)
    }
    return errResponse(HttpStatus.INTERNAL_SERVER_ERROR, errorMessage, context)
  },

  async handleResponseError(response: Response, context: Record<string, unknown>) {
    const errorStatus = response.status || HttpStatus.INTERNAL_SERVER_ERROR
    try {
      const errorData = (await response.json()) as { error?: string; message?: string }
      return errResponse(errorStatus, errorData.error || errorData.message || ErrorMessages.GENERIC, context)
    } catch (error) {
      return ErrHandler.handleGenericError(error, context)
    }
  },
}

export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function errResponse(status: number, message: string, context: Record<string, unknown>): ErrResponse {
  logger.error({ ...context, status }, message)
  return {
    error: message,
    status,
  }
}
