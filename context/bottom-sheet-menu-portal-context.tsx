"use client"

import { createContext, useContext } from "react"

/** When set, `AssetSelectorDropdown` portals its menu here so Radix Sheet treats interactions as inside the sheet. */
export const BottomSheetMenuPortalContext = createContext<HTMLElement | null>(null)

export function useBottomSheetMenuPortalHost(): HTMLElement | null {
  return useContext(BottomSheetMenuPortalContext)
}
