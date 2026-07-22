// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.).
import "@testing-library/jest-dom/vitest"

// jsdom does not provide TextEncoder/TextDecoder, which libraries like viem
// reference at import time. Polyfill them from Node's util for the test env.
import { TextDecoder, TextEncoder } from "util"

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
}
