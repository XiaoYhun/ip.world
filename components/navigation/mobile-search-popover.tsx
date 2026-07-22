"use client"

import { AnimatePresence, Easing, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useSearchDialog } from "@/context/search-dialog-context"
import useDebounce from "@/hooks/use-debounce"
import useSearchIp from "@/hooks/use-search-ip"
import useSearchToken from "@/hooks/use-search-token"
import IpListItem from "../ip-list-item"
import TokenListItem from "../token-list-item"
import { ScrollArea } from "../ui/scroll-area"
import Spinner from "../ui/spinner"

const MobileSearchPopover = () => {
  const router = useRouter()
  const { searchValue, closeDialog } = useSearchDialog()
  const debouncedSearchTerm = useDebounce(searchValue, 500)
  const query = debouncedSearchTerm.trim().length > 2 ? debouncedSearchTerm.trim() : ""

  const { data: tokens, isLoading: isLoadingTokens } = useSearchToken(query, true)
  const { data: ips, isLoading: isLoadingIPs } = useSearchIp(query, true)

  const isLoading = isLoadingTokens || isLoadingIPs

  // Animation variants for popover
  const popoverVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as Easing },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15 },
    },
  }

  // Animation variants for waterfall effect
  const waterfallVariants = {
    hidden: { opacity: 0.2, x: 0.5, scale: 0.1 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: 0.06 + i * 0.06,
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1] as Easing,
      },
    }),
  }

  // Only show popover when there's search content
  const shouldShow = searchValue.trim().length > 0

  // Prevent body scroll when popover is open
  useEffect(() => {
    if (shouldShow) {
      // Store the current scroll position
      const scrollY = window.scrollY

      // Add styles to prevent scrolling
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
      document.body.style.overflow = "hidden"

      // Cleanup function to restore scrolling
      return () => {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        document.body.style.overflow = ""
        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [shouldShow])

  if (!shouldShow) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        key="mobile-search-popover"
        variants={popoverVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="border-neutral-600 fixed top-[54px] right-0 left-0 z-100 max-h-[calc(100vh-54px)] border-t bg-black shadow-lg"
      >
        <div className="relative h-[32rem] max-h-[calc(100vh-10rem)]">
          {!isLoading && (tokens?.length || ips?.length) ? (
            <ScrollArea className="h-full">
              <div className="h-full">
                <AnimatePresence mode="wait">
                  <div key={query ? "search" : "trending"}>
                    {!!ips?.length && (
                      <div className="space-y-4">
                        <motion.p
                          className="px-4 pt-4 text-sm text-neutral-300"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={waterfallVariants}
                          custom={0}
                        >
                          {!query ? "Trending IPs" : "IPs"}
                        </motion.p>
                        <div className="flex flex-col">
                          {ips.map((ip, i) => (
                            <motion.div
                              key={ip.id}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={waterfallVariants}
                              custom={i + 1}
                            >
                              <div
                                onClick={() => {
                                  router.push(`/ip/${ip.id}`)
                                  closeDialog()
                                }}
                              >
                                <IpListItem ip={ip} />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!!tokens?.length && (
                      <div className="my-4 space-y-4">
                        <motion.p
                          className="px-4 text-sm text-neutral-300"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={waterfallVariants}
                          custom={ips?.length ? ips.length + 1 : 1}
                        >
                          {!query ? "Trending Tokens" : "Tokens"}
                        </motion.p>
                        <div className="flex flex-col">
                          {tokens.map((token, i) => (
                            <motion.div
                              key={token.id}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={waterfallVariants}
                              custom={ips?.length ? ips.length + 2 + i : 2 + i}
                            >
                              <div
                                onClick={() => {
                                  router.push(`/token/${token.token_address}`)
                                  closeDialog()
                                }}
                              >
                                <TokenListItem token={token} />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AnimatePresence>
              </div>
            </ScrollArea>
          ) : null}

          {/* Show loading or no results centered in the full popover */}
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <Spinner size={20} />
            </div>
          )}

          {!isLoading && !tokens?.length && !ips?.length && query && (
            <div className="flex h-full items-center justify-center">
              <p className="text-lg text-neutral-300">No results found</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MobileSearchPopover
