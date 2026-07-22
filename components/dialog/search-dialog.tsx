"use client"

import { AnimatePresence, Easing, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import useDebounce from "@/hooks/use-debounce"
import useSearchToken from "@/hooks/use-search-token"
import useSearchUsers from "@/hooks/use-search-users"
import { cn, getSearchShortcut } from "@/lib/utils"
import { formatNumber } from "@/lib/number"
import { Search } from "../icons/search"
import TokenListItem from "../token-list-item"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import Spinner from "../ui/spinner"
import Image from "next/image"
import { User } from "lucide-react"
import { Leaderboard } from "@/types/leaderboard"
import { Twitter } from "../icons/twitter"
import { Tiktok } from "../icons/tiktok"

const TABS_LIST = ["All", "Tokens", "Users"] as const
type Tab = (typeof TABS_LIST)[number]

const TABS: Record<string, Tab> = {
  ALL: "All",
  TOKENS: "Tokens",
  USERS: "Users",
}

type NavItem = {
  key: string
  action: () => void
}

function UserResultRow({ user, isActive, onClick }: { user: Leaderboard; isActive: boolean; onClick: () => void }) {
  const shortAddr = user.wallet_address
    ? `${user.wallet_address.slice(0, 6)} ... ${user.wallet_address.slice(-3)}`
    : ""

  const hasTwitter = !!user.socials?.twitter
  const hasTiktok = !!user.socials?.tiktok

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors",
        isActive ? "bg-white/10" : "hover:bg-white/5"
      )}
    >
      {user.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt={user.username || "User"}
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-600">
          <User size={18} className="text-neutral-300" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-white">
            @{user.username || user.wallet_address.slice(0, 8)}
          </span>
          {hasTwitter && (
            <span className="shrink-0 text-neutral-400"><Twitter size={12} /></span>
          )}
          {hasTiktok && (
            <span className="shrink-0 text-neutral-400"><Tiktok size={12} /></span>
          )}
        </div>
        <span className="font-mono text-xs text-neutral-400">{shortAddr}</span>
      </div>
      <div className="hidden items-center gap-5 sm:flex">
        <div className="text-right">
          <p className="font-mono text-[11px] text-neutral-400">Holdings</p>
          <p className="font-mono text-sm text-white">{formatNumber(user.referral_amount, 0, true)}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] text-neutral-400">Earned</p>
          <p className="font-mono text-sm text-white">{formatNumber(user.trading_points, 0, true)}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] text-neutral-400">Created</p>
          <p className="font-mono text-sm text-white">{formatNumber(user.referral_points, 0, true)}</p>
        </div>
      </div>
      <div className="ml-2 shrink-0 rounded-[10px] bg-neutral-600 px-3 py-1.5">
        <span className="text-sm font-semibold text-white">{formatNumber(user.total_points, 0, true)}</span>
        <span className="ml-1 text-xs text-neutral-400">pts</span>
      </div>
    </div>
  )
}

const SearchDialog = ({ trigger }: { trigger: ReactNode }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<Tab>(TABS.ALL)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const query = debouncedSearchTerm.trim().length > 2 ? debouncedSearchTerm.trim() : ""

  const { data: tokens, isLoading: isLoadingTokens } = useSearchToken(query, true)
  const { data: users, isLoading: isLoadingUsers } = useSearchUsers(query)

  const navigate = useCallback((path: string) => {
    setOpen(false)
    setTimeout(() => router.push(path), 200)
  }, [router])

  const flatItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = []

    if (currentTab === TABS.ALL) {
      if (tokens?.length) {
        tokens.slice(0, 6).forEach(t => {
          items.push({ key: `token-${t.token_address}`, action: () => navigate(`/token/${t.token_address}`) })
        })
      }
      if (query && users?.length) {
        users.slice(0, 4).forEach(u => {
          items.push({ key: `user-${u.wallet_address}`, action: () => navigate(`/@${u.username || u.wallet_address}`) })
        })
      }
    } else if (currentTab === TABS.TOKENS) {
      tokens?.forEach(t => {
        items.push({ key: `token-${t.token_address}`, action: () => navigate(`/token/${t.token_address}`) })
      })
    } else if (currentTab === TABS.USERS && query) {
      users?.forEach(u => {
        items.push({ key: `user-${u.wallet_address}`, action: () => navigate(`/@${u.username || u.wallet_address}`) })
      })
    }

    return items
  }, [currentTab, tokens, users, query, navigate])

  const activeKey = activeIndex >= 0 && activeIndex < flatItems.length ? flatItems[activeIndex].key : null

  useEffect(() => {
    setActiveIndex(-1)
  }, [currentTab, query])

  useEffect(() => {
    if (activeKey && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-nav-key="${activeKey}"]`)
      el?.scrollIntoView({ block: "nearest", inline: "nearest" })
    }
  }, [activeKey])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setActiveIndex(-1)
    }
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const count = flatItems.length

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault()
        setActiveIndex(prev => (prev < count - 1 ? prev + 1 : prev))
        break
      }
      case "ArrowUp": {
        e.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      }
      case "Enter": {
        if (activeIndex >= 0 && activeIndex < count) {
          e.preventDefault()
          flatItems[activeIndex].action()
        }
        break
      }
      case "Tab": {
        e.preventDefault()
        const dir = e.shiftKey ? -1 : 1
        const curIdx = TABS_LIST.indexOf(currentTab)
        const nextIdx = (curIdx + dir + TABS_LIST.length) % TABS_LIST.length
        setCurrentTab(TABS_LIST[nextIdx])
        break
      }
    }
  }, [flatItems, activeIndex, currentTab])

  const searchInputEl = (
    <span className="flex min-w-0 max-w-full flex-1 items-center gap-2 pl-1">
      <span className={cn("shrink-0", searchTerm ? "text-white" : "text-neutral-300")}>
        <Search size={12} />
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder={`Search (${getSearchShortcut()})`}
        className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-neutral-300 focus:shadow-none!"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </span>
  )

  const isLoading = currentTab === TABS.USERS ? isLoadingUsers : isLoadingTokens

  const modalGrowVariants = {
    initial: { scaleY: 0.7, opacity: 0, originY: 0 },
    animate: { scaleY: 1, opacity: 1, originY: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as Easing } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        hasCloseButton={false}
        overlayClassName="z-[100]"
        className="z-[100] min-w-0 w-full max-w-[calc(100vw-1rem)] rounded-[16px] bg-neutral-800! p-0 sm:max-w-(--breakpoint-sm)!"
      >
        <DialogHeader className="min-w-0 border-b border-neutral-600/80 px-3 py-3 backdrop-blur-none! sm:px-4 dark:bg-transparent!">
          <DialogTitle className="m-0 flex min-w-0 max-w-full text-left font-normal">{searchInputEl}</DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="modal-grow"
              variants={modalGrowVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ originY: 0, overflow: "hidden" }}
            >
              <div className="relative flex h-112! max-h-[min(28rem,calc(100dvh-8rem))] min-h-0 min-w-0 max-w-full flex-col">
                <div className="flex min-w-0 flex-wrap items-center gap-1 gap-y-2 px-3 pt-3 sm:px-5">
                  {TABS_LIST.map((tab) => (
                    <div
                      key={tab}
                      onClick={() => setCurrentTab(tab)}
                      className={cn(
                        "cursor-pointer rounded-[10px] px-2 py-1.5 text-sm font-medium transition-colors",
                        currentTab === tab
                          ? "bg-neutral-600 text-white"
                          : "text-neutral-300 hover:text-neutral-200"
                      )}
                    >
                      {tab}
                    </div>
                  ))}
                  <div className="ml-auto hidden min-w-0 flex-wrap items-center gap-1 text-[10px] text-neutral-500 sm:flex">
                    <kbd className="rounded border border-neutral-600 px-1 py-0.5 font-mono">↑↓</kbd>
                    <span>navigate</span>
                    <kbd className="ml-1 rounded border border-neutral-600 px-1 py-0.5 font-mono">↵</kbd>
                    <span>select</span>
                    <kbd className="ml-1 rounded border border-neutral-600 px-1 py-0.5 font-mono">Tab</kbd>
                    <span>switch</span>
                  </div>
                </div>
                {!isLoading && (tokens?.length || users?.length || currentTab === TABS.USERS) ? (
                  <div ref={scrollRef} className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-x-none">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTab + (query ? "-search" : "-trending")}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {currentTab === TABS.ALL && (
                          <>
                            {!!tokens?.length && (
                              <div className="my-4 space-y-4">
                                <motion.p
                                  className="mb-2 px-5 text-xs font-semibold text-neutral-300 uppercase"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  {!query ? "Trending Tokens" : "Tokens"}
                                </motion.p>
                                <motion.div
                                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
                                  initial="hidden"
                                  animate="visible"
                                  className="flex min-w-0 max-w-full flex-col px-2 sm:px-3.5"
                                >
                                  {tokens.slice(0, 6).map((token) => (
                                    <motion.div
                                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                      key={token.token_address}
                                      data-nav-key={`token-${token.token_address}`}
                                      onClick={() => navigate(`/token/${token.token_address}`)}
                                      className={cn(
                                        "min-w-0 max-w-full rounded-[10px] transition-colors",
                                        activeKey === `token-${token.token_address}` ? "bg-white/10" : "hover:bg-white/5"
                                      )}
                                    >
                                      <TokenListItem token={token} compact />
                                    </motion.div>
                                  ))}
                                </motion.div>
                              </div>
                            )}

                            {query && !!users?.length && (
                              <div className="my-4 space-y-4">
                                <motion.p
                                  className="mb-2 px-5 text-xs font-semibold text-neutral-300 uppercase"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  User
                                </motion.p>
                                <motion.div
                                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
                                  initial="hidden"
                                  animate="visible"
                                  className="flex min-w-0 max-w-full flex-col px-2 sm:px-3.5"
                                >
                                  {users.slice(0, 4).map((user) => (
                                    <motion.div
                                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                      key={user.wallet_address}
                                      data-nav-key={`user-${user.wallet_address}`}
                                    >
                                      <UserResultRow
                                        user={user}
                                        isActive={activeKey === `user-${user.wallet_address}`}
                                        onClick={() => navigate(`/@${user.username || user.wallet_address}`)}
                                      />
                                    </motion.div>
                                  ))}
                                </motion.div>
                              </div>
                            )}
                          </>
                        )}

                        {currentTab === TABS.TOKENS && !!tokens?.length && (
                          <div className="my-4 space-y-4">
                            <motion.div
                              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
                              initial="hidden"
                              animate="visible"
                              className="flex min-w-0 max-w-full flex-col px-2 sm:px-3.5"
                            >
                              {tokens.map((token) => (
                                <motion.div
                                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                  key={token.token_address}
                                  data-nav-key={`token-${token.token_address}`}
                                  onClick={() => navigate(`/token/${token.token_address}`)}
                                  className={cn(
                                    "min-w-0 max-w-full rounded-[10px] transition-colors",
                                    activeKey === `token-${token.token_address}` ? "bg-white/10" : "hover:bg-white/5"
                                  )}
                                >
                                  <TokenListItem token={token} compact />
                                </motion.div>
                              ))}
                            </motion.div>
                          </div>
                        )}

                        {currentTab === TABS.USERS && (
                          <div className="my-4 space-y-4">
                            {query && !!users?.length ? (
                              <motion.div
                                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col px-3.5"
                              >
                                {users.map((user) => (
                                  <motion.div
                                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                    key={user.wallet_address}
                                    data-nav-key={`user-${user.wallet_address}`}
                                  >
                                    <UserResultRow
                                      user={user}
                                      isActive={activeKey === `user-${user.wallet_address}`}
                                      onClick={() => navigate(`/@${user.username || user.wallet_address}`)}
                                    />
                                  </motion.div>
                                ))}
                              </motion.div>
                            ) : query && !isLoadingUsers ? (
                              <div className="flex h-full items-center justify-center px-5 py-8">
                                <p className="text-sm text-neutral-300">No users found</p>
                              </div>
                            ) : !query ? (
                              <div className="flex h-full items-center justify-center px-5 py-8">
                                <p className="text-sm text-neutral-300">Search for users by username</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ) : null}

                {isLoading && (
                  <div className="flex h-full items-center justify-center">
                    <Spinner size={20} />
                  </div>
                )}

                {!isLoading && !tokens?.length && !users?.length && query && currentTab !== TABS.USERS && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-neutral-300">No results found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog
