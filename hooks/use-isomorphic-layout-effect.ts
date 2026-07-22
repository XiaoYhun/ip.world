"use client"

// From: https://github.com/reduxjs/react-redux/blob/master/src/utils/useIsomorphicLayoutEffect.ts
import { useEffect, useLayoutEffect } from "react"

// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect in the browser.

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined"
    ? useLayoutEffect
    : useEffect
