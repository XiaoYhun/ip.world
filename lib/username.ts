import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@/lib/constants"

export const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/

export const USERNAME_VALIDATION_MESSAGE = `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} chars and use only letters, numbers, dots, hyphens, or underscores`

export function normalizeUsernameInput(username: string): string {
  return username.trim()
}

export function sanitizeUsernameInput(username: string): string {
  return username.replace(/[^A-Za-z0-9._-]/g, "").slice(0, USERNAME_MAX_LENGTH)
}

export function isUsernameValid(username: string): boolean {
  return USERNAME_REGEX.test(normalizeUsernameInput(username))
}

export function getUsernameValidationError(username: string): string | null {
  const normalizedUsername = normalizeUsernameInput(username)

  if (!normalizedUsername) {
    return "Username is required"
  }

  if (!isUsernameValid(normalizedUsername)) {
    return USERNAME_VALIDATION_MESSAGE
  }

  return null
}

export function getOptionalUsernameValidationError(username: string): string | null {
  const normalizedUsername = normalizeUsernameInput(username)
  if (!normalizedUsername) {
    return null
  }

  return getUsernameValidationError(normalizedUsername)
}
