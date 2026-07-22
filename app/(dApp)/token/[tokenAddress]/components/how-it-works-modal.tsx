"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight, ChevronLeft, X } from "lucide-react"
import { Remix } from "@/types/remix"
import { Ip } from "@/types/ip"
import { useProfile } from "@/hooks/use-profile"
import { truncateTagForDisplay } from "@/lib/tiktok-tag"
import { buildTokenSocialRewardTags } from "@/lib/social-reward-tags"
import Link from "next/link"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"

// ─── Copyable tag ─────────────────────────────────────────────────────────────

function CopyableTag({ label, copyText, prefix }: { label: string; copyText: string; prefix?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copyText}
      className="inline-flex max-w-[min(100%,11rem)] min-w-0 items-center gap-1 rounded border border-[#313131] bg-[#1e1e1e] px-1.5 py-0.5 align-middle text-xs text-[#d9d9d9] transition-colors hover:border-[#4a4a4a] hover:bg-[#2a2a2a]"
    >
      {prefix ? <span className="flex shrink-0 items-center">{prefix}</span> : null}
      <span className="min-w-0 truncate text-center">{label}</span>
      <span className="shrink-0">
        {copied ? (
          <Check size={10} className="text-[#797979]" />
        ) : (
          <Copy size={10} className="text-[#797979]" />
        )}
      </span>
    </button>
  )
}

// ─── Step illustrations ───────────────────────────────────────────────────────

function IllustrationStep1() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "28px 28px",
          transform: "rotate(3.07deg) scale(1.15)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 h-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-700/20 blur-3xl" />

      <motion.div
        className="absolute flex flex-col items-center gap-2"
        style={{ left: "14%", top: "50%", translateY: "-50%" }}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ffffff18] bg-[#111] shadow-[0_8px_32px_#00000080]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <span className="text-[10px] text-[#797979]" style={{ fontFamily: "'Geist', sans-serif" }}>
          X / Twitter
        </span>
      </motion.div>

      <div className="absolute left-[26%] right-[26%] h-px overflow-hidden" style={{ top: "50%" }}>
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-purple-500/70 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#6b21a8]/50 bg-[#1a1a1a]"
        animate={{ boxShadow: ["0 0 10px #7c3aed20", "0 0 30px #7c3aed55", "0 0 10px #7c3aed20"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span
          className="text-center text-xs font-semibold leading-tight text-white"
          style={{ fontFamily: "'Archivo', sans-serif" }}
        >
          IP
          <br />
          World
        </span>
      </motion.div>

      <motion.div
        className="absolute flex flex-col items-center gap-2"
        style={{ right: "14%", top: "50%", translateY: "-50%" }}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ffffff18] bg-[#111] shadow-[0_8px_32px_#00000080]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.29 8.29 0 004.84 1.55V6.78a4.85 4.85 0 01-1.07-.09z" />
          </svg>
        </div>
        <span className="text-[10px] text-[#797979]" style={{ fontFamily: "'Geist', sans-serif" }}>
          TikTok
        </span>
      </motion.div>
    </div>
  )
}

function IllustrationStep2({ refCode }: { refCode: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "28px 28px",
          transform: "rotate(3.07deg) scale(1.15)",
        }}
      />
      <div className="absolute h-40 w-64 rounded-full bg-purple-700/15 blur-3xl" />

      <motion.div
        className="relative w-64 overflow-hidden rounded-[12px] border border-[#313131] bg-[#111] shadow-[0_12px_40px_#00000070]"
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 border-b border-[#1e1e1e] px-4 pb-3 pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#313131] bg-[#242424] text-sm">
            👤
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-2.5 w-24 rounded-full bg-[#313131]" />
            <div className="h-2 w-16 rounded-full bg-[#242424]" />
          </div>
          <div className="ml-auto text-[10px] text-[#797979]" style={{ fontFamily: "'Geist', sans-serif" }}>
            bio
          </div>
        </div>

        <div className="px-4 py-3">
          <div
            className="mb-2 text-[9px] uppercase tracking-widest text-[#484848]"
            style={{ fontFamily: "'Geist', sans-serif" }}
          >
            📌 Pinned
          </div>
          <motion.div
            className="flex items-center gap-2 rounded-[10px] border border-[#6b21a8]/40 bg-[#161616] px-3 py-2.5"
            animate={{ borderColor: ["#6b21a840", "#7c3aed70", "#6b21a840"] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <span className="font-mono text-[11px] text-purple-400" style={{ fontFamily: "'Geist', sans-serif" }}>
              ip.world/?ref={refCode}
            </span>
            <span className="text-[8px]">🔗</span>
            <motion.div
              className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function IllustrationStep3({ tiktokTag, xTag }: { tiktokTag: string; xTag: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-6 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "28px 28px",
          transform: "rotate(3.07deg) scale(1.15)",
        }}
      />
      <div className="absolute h-36 w-72 rounded-full bg-amber-600/10 blur-3xl" />

      {[
        { emoji: "tiktok", tag: tiktokTag, delay: 0 },
        { emoji: "𝕏", tag: xTag, delay: 0.12 },
      ]
        .filter(({ tag }) => tag)
        .map(({ emoji, tag, delay }) => (
          <motion.div
            key={tag}
            className="relative flex flex-col items-center gap-2"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-[#ffffff10] bg-[#111] px-1.5 shadow-[0_12px_40px_#00000070]"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.8 + delay, repeat: Infinity, ease: "easeInOut", delay: delay * 4 }}
            >
              {emoji === "tiktok" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.29 8.29 0 004.84 1.55V6.78a4.85 4.85 0 01-1.07-.09z" /></svg>
              ) : (
                <span className="text-2xl">{emoji}</span>
              )}
              <div className="w-full min-w-0 px-0.5">
                <span
                  className="block w-full min-w-0 truncate text-center text-[9px] font-medium leading-none text-[#797979]"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                  title={tag}
                >
                  {truncateTagForDisplay(tag, 14)}
                </span>
              </div>
            </motion.div>
            <motion.span
              className="absolute -right-1.5 -top-1.5 text-sm text-amber-400/60"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay }}
            >
              ✦
            </motion.span>
          </motion.div>
        ))}

      {[...Array(5)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-xs text-amber-400/40"
          style={{ left: `${15 + i * 16}%`, top: "8%" }}
          animate={{ y: [0, 40], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, ease: "easeIn" }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  )
}

// ─── Transition config ────────────────────────────────────────────────────────

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
}
const pageTrans = { type: "tween" as const, ease: [0.25, 0.1, 0.25, 1] as const, duration: 0.28 }

// ─── Component ────────────────────────────────────────────────────────────────

interface HowItWorksModalProps {
  open: boolean
  onClose: () => void
  remix?: Remix
  ip?: Ip
}

export function HowItWorksModal({ open, onClose, remix, ip }: HowItWorksModalProps) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const { user } = useProfile()

  const { tiktokTag, xTag } = buildTokenSocialRewardTags({
    tokenName: remix?.name,
    tokenSymbol: remix?.symbol,
    ipName: ip?.title,
  })
  const refCode = user?.referral_code || user?.username || "user"

  const steps = [
    {
      number: "STEP 1",
      title: "Link your socials",
      body: (
        <>
          <Link href="/settings" className="cursor-pointer text-white underline">
            Connect
          </Link>{" "}
          your{" "}
          <span className="inline-flex items-center gap-1">
            <svg className="inline" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>{" "}
            X
          </span>{" "}
          or{" "}
          <span className="inline-flex items-center gap-1">
            <svg className="inline" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.29 8.29 0 004.84 1.55V6.78a4.85 4.85 0 01-1.07-.09z" />
            </svg>{" "}
            TikTok
          </span>{" "}
          to IP World
        </>
      ),
      illustration: <IllustrationStep1 />,
    },
    {
      number: "STEP 2",
      title: "Refer Other Users",
      body: (
        <>
          Pin your reflink{" "}
          <CopyableTag label={refCode} copyText={`https://ip.world/?ref=${refCode}`} />{" "}
          to bio
        </>
      ),
      illustration: <IllustrationStep2 refCode={refCode} />,
    },
    {
      number: "STEP 3",
      title: "Earn Rewards",
      body: (
        <>
          Tag{" "}
          <CopyableTag label={tiktokTag} copyText={tiktokTag} prefix={<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.29 8.29 0 004.84 1.55V6.78a4.85 4.85 0 01-1.07-.09z" /></svg>} />{" "}
          {xTag ? <>or <CopyableTag label={xTag} copyText={xTag} prefix={<span>𝕏</span>} /> </> : null}
          on your post
        </>
      ),
      illustration: <IllustrationStep3 tiktokTag={tiktokTag} xTag={xTag} />,
    },
  ]

  const go = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep(0)
      setDir(1)
    }, 300)
  }

  const current = steps[step]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border-[0.5px] border-[#313131] bg-[#191919] shadow-[0_32px_80px_#000000a0]"
              initial={{ scale: 0.93, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 18 }}
              transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Illustration area */}
              <div className="relative h-[200px] flex-shrink-0 overflow-hidden border-b border-[#1e1e1e] bg-[#101010]">
                <AnimatePresence custom={dir} mode="popLayout">
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={pageTrans}
                    className="absolute inset-0"
                  >
                    {current.illustration}
                  </motion.div>
                </AnimatePresence>

                <button
                  onClick={handleClose}
                  className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#313131] bg-[#1e1e1e] text-[#797979] transition-colors hover:bg-[#2a2a2a] hover:text-white"
                >
                  <X size={13} />
                </button>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#191919] to-transparent" />
              </div>

              {/* Content area */}
              <div className="flex flex-col gap-5 px-5 pb-5 pt-5">
                <AnimatePresence custom={dir} mode="popLayout">
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={pageTrans}
                    className="flex min-h-[88px] flex-col gap-2"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-purple-400">
                      {current.number}
                    </span>
                    <h2 className="text-[22px] font-semibold leading-tight text-white">
                      {current.title}
                    </h2>
                    <p className="flex flex-wrap items-center gap-1 text-[13px] leading-[1.6] text-[#b3b3b3]">
                      {current.body}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Nav row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {steps.map((_, i) => (
                      <button key={i} onClick={() => go(i)}>
                        <motion.div
                          className="h-[3px] origin-left rounded-full bg-purple-500"
                          animate={{ width: i === step ? 20 : 6, opacity: i === step ? 1 : 0.25 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button
                        onClick={() => go(step - 1)}
                        className="flex items-center gap-1 rounded-[10px] px-3 py-2 text-xs font-medium text-[#797979] transition-colors hover:bg-[#242424] hover:text-white"
                      >
                        <ChevronLeft size={13} />
                        Back
                      </button>
                    )}

                    {step < steps.length - 1 ? (
                      <button
                        onClick={() => go(step + 1)}
                        className="flex items-center gap-1.5 rounded-[10px] bg-[#321f4d] px-4 py-2 text-xs font-medium text-[#dfcdf9] transition-colors hover:bg-[#3d2560]"
                      >
                        Next
                        <ChevronRight size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={handleClose}
                        className="flex items-center gap-1.5 rounded-[10px] bg-[#321f4d] px-4 py-2 text-xs font-medium text-[#dfcdf9] transition-colors hover:bg-[#3d2560]"
                      >
                        Get started
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
