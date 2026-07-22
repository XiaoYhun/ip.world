/**
 * Canonical mobile breakpoint for the dApp: viewports **below** Tailwind `md` (768px).
 * Use `MOBILE_MEDIA_QUERY` with `useMediaQuery` so JS matches `md:` / `max-md:` classes.
 */
export const MOBILE_BREAKPOINT_PX = 768

/** Matches Tailwind `max-md` — mobile is width <= 767px */
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`

/** Horizontal page gutter (mobile) */
export const MOBILE_PAGE_GUTTER_CLASS = "px-4"

/** Bottom padding for sticky CTAs + safe area (iOS) */
export const MOBILE_STICKY_CTA_PADDING_CLASS = "pb-[max(2rem,env(safe-area-inset-bottom))]"

/** Minimum tap target height (approx 44px) */
export const MOBILE_MIN_TAP_CLASS = "min-h-11 min-w-11"
