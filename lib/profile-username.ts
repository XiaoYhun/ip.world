import { USERNAME_MAX_LENGTH } from "@/lib/constants"

/** Profile usernames: ASCII letters, digits, dots, hyphens, and underscores. */
export const PROFILE_USERNAME_PATTERN = /^[A-Za-z0-9._-]*$/

/** Strips whitespace, then removes any character outside [A-Za-z0-9._-]. */
export function sanitizeProfileUsernameInput(value: string): string {
  return value.replace(/\s/g, "").replace(/[^A-Za-z0-9._-]/g, "").slice(0, USERNAME_MAX_LENGTH)
}
