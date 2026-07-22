"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Download, Copy, Check } from "lucide-react"
import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react"
import { toPng } from "html-to-image"
import { Ip } from "@/components/icons"
import { toast } from "sonner"

// ─── Figma assets ─────────────────────────────────────────────────────────────
const ASSET_BG_LINES = "/images/pnl-card/bg-lines.svg"
const ASSET_RADIAL_BLOB = "/images/pnl-card/radial-blob.png"
const ASSET_IP_BADGE = "/images/pnl-card/ip-badge.png"
const ASSET_UNION_LG = "/images/pnl-card/union-lg.svg"
const ASSET_UNION_SM = "/images/pnl-card/union-sm.svg"
const ASSET_TICKER_SWIRL = "/images/pnl-card/ticker-swirl.svg"
// const ASSET_TOKEN_IMAGE   = "/images/pnl-card/token-image.jpg"
// const ASSET_USER_AVATAR   = "/images/pnl-card/user-avatar.png"

// ─── Card canvas size (matches Figma 1407:131) ────────────────────────────────
const CARD_W = 1920
const CARD_H = 1080
/** Half-scale preview size before fitting to viewport (see preview fit scale). */
const PREVIEW_W = CARD_W / 2
const PREVIEW_H = CARD_H / 2

// ─── Mock data ────────────────────────────────────────────────────────────────
// const MOCK = {
//   symbol: "KITTY",
//   imageUrl: ASSET_TOKEN_IMAGE,
//   pnlPercent: "$5,241.00",
//   pnlChange: "+65.5%",
//   isPositive: true,
//   entryPrice: "104K",
//   exitPrice: "$1.23M",
//   username: "@brainrotmanager",
//   avatarUrl: ASSET_USER_AVATAR,
// }

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PnlCardData {
  symbol: string
  imageUrl: string
  pnlPercent: string
  pnlChange?: string
  isPositive: boolean
  entryPrice: string
  exitPrice: string
  username: string
  avatarUrl?: string
}

interface PnlCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data?: PnlCardData
}

// ─── Layer: background lines ──────────────────────────────────────────────────
function LayerBgLines() {
  return (
    <div
      data-pnl-layer="bg-lines"
      style={{ pointerEvents: "none", position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={ASSET_BG_LINES}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          minHeight: "100%",
          minWidth: "100%",
          transform: "translate(-50%,-50%)",
          objectFit: "cover",
        }}
      />
    </div>
  )
}

// ─── Layer: radial blob ───────────────────────────────────────────────────────
function LayerRadialBlob({ isPositive = true }: { isPositive?: boolean }) {
  return (
    <div
      data-pnl-layer="radial-blob"
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        filter: isPositive ? undefined : "grayscale(1) sepia(1) hue-rotate(325deg) saturate(2) brightness(0.8)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={ASSET_RADIAL_BLOB}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          height: "160%",
          width: "200%",
          transform: "translate(-50%,-50%)",
          objectFit: "cover",
        }}
      />
    </div>
  )
}

// ─── Layer: floating IP badge ─────────────────────────────────────────────────
function LayerFloatingBadge({
  size,
  rotation,
  blur,
  opacity,
  positionStyle,
  isPositive = true,
}: {
  size: number
  rotation: string
  blur?: string
  opacity?: string
  positionStyle: React.CSSProperties
  isPositive?: boolean
}) {
  const colorFilter = isPositive ? undefined : "hue-rotate(290deg) saturate(1.4) brightness(0.85)"
  return (
    <div
      data-pnl-layer="floating-badge"
      style={{ pointerEvents: "none", position: "absolute", ...positionStyle }}
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          transform: `rotate(${rotation})`,
          filter: [colorFilter, blur ? `blur(${blur})` : undefined].filter(Boolean).join(" ") || undefined,
          opacity: opacity != null ? Number(opacity) : 1,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={ASSET_IP_BADGE}
          style={{ position: "absolute", width: "100%", height: "100%", maxWidth: "none" }}
        />
        <div style={{ position: "absolute", inset: "26%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={size >= 160 ? ASSET_UNION_LG : ASSET_UNION_SM}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              maxWidth: "none",
              top: size >= 160 ? -15 : -5,
              transform: isPositive ? undefined : "rotate(180deg)",
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Layer: decorative rays behind token ──────────────────────────────────────
function LayerTokenRays() {
  return (
    <>
      {/* Pink starburst — positioned to peek above+left of token */}
      <div
        data-pnl-layer="token-rays-starburst"
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: "calc(20% + 309px)",
          top: 159,
          zIndex: 3,
        }}
      >
        <div style={{ transform: "rotate(-11.28deg)" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="345"
            height="262"
            viewBox="0 0 308 212"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <path
              d="M131.991 3.65886L160.296 34.3171L196.2 5.41193e-05L201.579 38.0475L252.809 14.5796L234.325 53.3763L292.041 44.8661L252.882 77.6534L307.11 85.6239L254.035 106.677L295.414 129.813L237.582 135.435L258.966 169.785L206.377 158.952L204.08 198.635L165.8 173.159L140.232 211.371L122.886 175.606L78.4776 205.786L85.0459 165.86L29.4824 182.856L58.8186 145.615L1.72096 146.538L48.7483 118.371L-0.000263747 103.118L56.5704 88.8319L24.6162 60.0957L80.9295 62.1127L71.2993 24.9133L117.622 42.8289L131.991 3.65886Z"
              fill="#FF00E6"
            />
          </svg>
        </div>
      </div>

      {/* Purple swirl — positioned below-right of token */}
      <div
        data-pnl-layer="token-rays-swirl"
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: "calc(40% + 155px)",
          top: 364,
          zIndex: 3,
        }}
      >
        <svg
          viewBox="0 0 326.82 272.03"
          width="327"
          height="272"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient
              id="pnl-rays-purple"
              x1="278.5"
              y1="18.9941"
              x2="44.5"
              y2="238.494"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#D191FF" />
              <stop offset="1" stopColor="#A650E3" />
            </linearGradient>
          </defs>
          <path
            d="M0 184.53C0 184.53 129.53 160.74 62.3 272.03C136.49 189.11 189.36 174.86 303.81 229.14C229.88 176.26 212.25 124.36 326.82 99.39C326.82 99.39 205.12 120.49 219.1 0C182.47 125.41 105.02 91.07 38.43 22.03C38.43 22.03 154.47 142.48 0 184.52L0 184.53Z"
            fill="url(#pnl-rays-purple)"
          />
        </svg>
      </div>
    </>
  )
}

// ─── Layer: token image ───────────────────────────────────────────────────────
function LayerTokenImage({ imageUrl, symbol }: { imageUrl: string; symbol: string }) {
  const hasImage = !!imageUrl
  return (
    <div
      data-pnl-layer="token-image"
      style={{
        position: "absolute",
        left: "calc(40% + 28px)",
        top: 229,
        width: 330,
        height: 330,
        overflow: "hidden",
        borderRadius: 102,
        border: "8px solid rgba(255,255,255,0.14)",
        zIndex: 5,
      }}
    >
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={symbol}
            data-export-kind="token-image"
            style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }}
          />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#2d2d2d,#1b1b1b)",
            color: "#d0d0d0",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontSize: 72,
            fontWeight: 700,
          }}
        >
          {symbol ? symbol.charAt(0).toUpperCase() : "?"}
        </div>
      )}
    </div>
  )
}

// ─── Layer: ticker / symbol badge ─────────────────────────────────────────────
function LayerTickerBadge({ symbol }: { symbol: string }) {
  return (
    <div
      data-pnl-layer="ticker-badge"
      style={{
        position: "absolute",
        left: "calc(40% + 162px)",
        top: 166,
        zIndex: 6,
      }}
    >
      {/* Swirl texture behind badge */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: "-100%",
          right: "-100%",
          bottom: "-100%",
          left: "-100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={ASSET_TICKER_SWIRL}
          style={{ position: "absolute", width: "100%", height: "100%", maxWidth: "none" }}
        />
      </div>
      <div
        style={{
          position: "relative",
          transform: "rotate(11.94deg)",
          overflow: "hidden",
          borderRadius: 24,
          border: "4px solid #9e5aff",
          background: "#ad74fe",
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 18,
          paddingBottom: 18,
          boxShadow: "0px 9px 13px 6px rgba(0,0,0,0.18)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontSize: 55,
            fontWeight: 600,
            lineHeight: 1.04,
            color: "#321f4d",
            whiteSpace: "nowrap",
            fontVariationSettings: "'wdth' 100",
            fontFeatureSettings: "'lnum' 1, 'tnum' 1",
          }}
        >
          ${symbol}
        </span>
      </div>
    </div>
  )
}

// ─── Layer: main (large) PNL dollar pill ──────────────────────────────────────
function LayerPnlPillMain({ pnlPercent, isPositive }: { pnlPercent: string; isPositive: boolean }) {
  const border = isPositive ? "3.87px solid #9fb845" : "3.87px solid #ff4040"
  const bg = isPositive
    ? "linear-gradient(180deg,#e2ff7b 0%,#a5d305 100%)"
    : "linear-gradient(180deg,#ff8b7b 0%,#d32505 100%)"
  const textTop = isPositive ? "#445503" : "#1a0000"

  return (
    <div
      data-pnl-layer="pnl-pill-main"
      style={{
        position: "absolute",
        left: "50%",
        top: "calc(50% + 28.85px)",
        transform: "translateX(-50%) translateY(-50%) rotate(-0.89deg)",
        zIndex: 8,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 68,
          paddingLeft: 48,
          paddingRight: 48,
          paddingTop: 23,
          paddingBottom: 23,
          boxShadow: "0px -27px 56px 7.7px rgba(0,0,0,0.5)",
          border,
          background: bg,
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontSize: 139,
            fontWeight: 900,
            lineHeight: 1.04,
            background: `linear-gradient(180deg, ${textTop} 0%, rgba(120,120,120,0.95) 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            transform: "skewX(-17deg) scaleY(0.96)",
            whiteSpace: "nowrap",
            fontVariationSettings: "'wdth' 100",
            fontFeatureSettings: "'lnum' 1, 'tnum' 1",
          }}
        >
          {pnlPercent}
        </span>
      </div>
    </div>
  )
}

// ─── Layer: secondary (small) PNL percent pill ────────────────────────────────
function LayerPnlPillChange({ pnlChange, isPositive }: { pnlChange?: string; isPositive: boolean }) {
  if (!pnlChange) return null

  const border = isPositive ? "1.985px solid #9fb845" : "1.985px solid #ff4040"
  const bg = isPositive
    ? "linear-gradient(180deg,#e2ff7b 0%,#a5d305 100%)"
    : "linear-gradient(180deg,#ff8b7b 0%,#d32505 100%)"
  const textTop = isPositive ? "#445503" : "#1a0000"

  return (
    <div
      data-pnl-layer="pnl-pill-change"
      style={{
        position: "absolute",
        left: "50%",
        top: "calc(50% + 137.3px)",
        transform: "translateX(-50%) translateY(-50%) rotate(0.6deg)",
        zIndex: 8,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 35,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 12,
          paddingBottom: 12,
          boxShadow: "0px -14px 29px 4px rgba(0,0,0,0.5)",
          border,
          background: bg,
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontSize: 71,
            fontWeight: 900,
            lineHeight: 1.04,
            background: `linear-gradient(180deg, ${textTop} 0%, rgba(120,120,120,0.95) 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            transform: "skewX(-17deg) scaleY(0.96)",
            whiteSpace: "nowrap",
            fontVariationSettings: "'wdth' 100",
            fontFeatureSettings: "'lnum' 1, 'tnum' 1",
          }}
        >
          {pnlChange}
        </span>
      </div>
    </div>
  )
}

// ─── Layer: stat cards (Bought / Holding) ─────────────────────────────────────
function LayerStatCards({ entryPrice, exitPrice }: { entryPrice: string; exitPrice: string }) {
  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    borderRadius: 32,
    border: "0.985px solid rgba(255,255,255,0.1)",
    background: "rgba(61,61,61,0.5)",
    backdropFilter: "blur(4.9px)",
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 24,
    paddingBottom: 24,
    whiteSpace: "nowrap",
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: '"Geist Mono", monospace',
    fontSize: 24,
    fontWeight: 500,
    color: "#747474",
    lineHeight: 1.04,
    fontFeatureSettings: "'lnum' 1, 'tnum' 1",
  }
  const valueStyle: React.CSSProperties = {
    fontFamily: "var(--font-archivo), Archivo, sans-serif",
    fontSize: 48,
    fontWeight: 500,
    color: "#ffffff",
    lineHeight: 1.04,
    fontVariationSettings: "'wdth' 100",
    fontFeatureSettings: "'lnum' 1, 'tnum' 1",
  }

  return (
    <>
      {/* Bought — left of center */}
      <div
        data-pnl-layer="stat-entry"
        style={{ position: "absolute", left: "calc(50% - 145.5px)", top: 759.74, transform: "translateX(-100%)", zIndex: 9 }}
      >
        <div style={cardStyle}>
          <span style={labelStyle}>Bought</span>
          <span style={valueStyle}>{entryPrice}</span>
        </div>
      </div>

      {/* Holding — right of center */}
      <div
        data-pnl-layer="stat-exit"
        style={{ position: "absolute", left: "calc(50% + 145.5px)", top: 759.74, zIndex: 9 }}
      >
        <div style={cardStyle}>
          <span style={labelStyle}>Holding</span>
          <span style={valueStyle}>{exitPrice}</span>
        </div>
      </div>
    </>
  )
}

// ─── Layer: username pill ─────────────────────────────────────────────────────
function LayerUsernamePill({ username, avatarUrl }: { username: string; avatarUrl?: string }) {
  return (
    <div
      data-pnl-layer="username-pill"
      style={{
        position: "absolute",
        left: "50%",
        top: 928.4,
        transform: "translateX(-50%)",
        zIndex: 9,
        display: "flex",
        alignItems: "center",
        gap: 8,
        overflow: "hidden",
        borderRadius: 29,
        border: "0.88px solid rgba(255,255,255,0.1)",
        background: "rgba(61,61,61,0.5)",
        backdropFilter: "blur(4.4px)",
        paddingLeft: 18,
        paddingRight: 18,
        paddingTop: 15,
        paddingBottom: 16,
        whiteSpace: "nowrap",
      }}
    >
      {avatarUrl ? (
        <div
          style={{
            position: "relative",
            width: 56,
            height: 56,
            flexShrink: 0,
            overflow: "hidden",
            borderRadius: 9999,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={username}
            data-export-kind="avatar-image"
            style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            width: 56,
            height: 56,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 9999,
            background: "#404040",
            fontSize: 20,
            color: "#ffffff",
          }}
        >
          {username.replace("@", "").charAt(0).toUpperCase()}
        </div>
      )}
      <span
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontSize: 35,
          fontWeight: 500,
          color: "#ffffff",
          fontVariationSettings: "'wdth' 100",
          lineHeight: 1.04,
        }}
      >
        {username}
      </span>
      <div
        data-pnl-layer="username-ip-badge"
        style={{
          display: "flex",
          width: 57,
          height: 57,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9999,
          background: "rgba(0,0,0,0.4)",
        }}
      >
        <Ip size={24} />
      </div>
    </div>
  )
}

// ─── Layer: IP.world logo ─────────────────────────────────────────────────────
function LayerLogo() {
  return (
    <div
      data-pnl-layer="logo"
      style={{ position: "absolute", top: 48, left: 48, zIndex: 20 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="62" viewBox="0 0 64 62" fill="none">
        <path d="M3.02441 45.8028C5.69899 43.8227 8.02258 42.0654 11.0355 39.8724C15.4735 46.8281 22.2224 51.5766 30.4413 51.9546C36.1429 52.2169 41.2393 50.4315 45.6436 46.8013C50.6726 42.6564 53.4469 37.269 53.9411 30.7575C54.4339 24.2672 51.4883 18.0153 47.2343 13.0806C49.9033 11.0102 52.7604 8.99067 55.4069 7.03174C61.5591 13.2893 66.1908 24.9837 62.9195 37.4438C59.4349 50.7192 48.4361 59.9807 35.6206 61.7027C21.8714 63.5502 9.30722 56.6199 3.02441 45.8042V45.8028Z" fill="white" />
        <path d="M29.9148 1.57104C33.5834 -1.09164 38.7065 -0.287755 41.339 3.36356C43.97 7.01205 43.1487 12.2161 39.525 14.852C35.8522 17.5246 30.7263 16.6826 28.0433 12.965C25.4431 9.36305 26.2897 4.20129 29.9148 1.56963V1.57104Z" fill="white" />
        <path d="M0 27.157L19.3833 12.9932L27.4323 23.9669L8.04901 38.1293L0 27.157Z" fill="white" />
      </svg>
    </div>
  )
}

// ─── Main dialog ──────────────────────────────────────────────────────────────
export default function PnlCardDialog({ open, onOpenChange, data }: PnlCardDialogProps) {
  // Always use MOCK so pnlChange, entryPrice, exitPrice etc. are never missing
  // const d = MOCK
  const cardRef = useRef<HTMLDivElement>(null)
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [copied, setCopied] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  /** Scale the on-screen preview so it fits narrow phones (export still uses full CARD_W×CARD_H). */
  const [previewFitScale, setPreviewFitScale] = useState(1)

  const proxiedTokenImageUrl = useMemo(() => {
    const src = data?.imageUrl || ""
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src
    if (!src.startsWith("http://") && !src.startsWith("https://")) return src
    return `/api/images/proxy?url=${encodeURIComponent(src)}`
  }, [data?.imageUrl])

  const proxiedAvatarUrl = useMemo(() => {
    const src = data?.avatarUrl || ""
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src
    if (!src.startsWith("http://") && !src.startsWith("https://")) return src
    return `/api/images/proxy?url=${encodeURIComponent(src)}`
  }, [data?.avatarUrl])

  const waitForNextFrame = useCallback(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }, [])

  const generatePngDataUrl = useCallback(async (mode: "none" | "drop-avatar-remote" | "drop-all-remote" = "none"): Promise<string | null> => {
    if (!cardRef.current) return null
    await document.fonts.ready
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 1,
      backgroundColor: "#0d0d0d",
      width: CARD_W,
      height: CARD_H,
      cacheBust: true,
      includeQueryParams: true,
      filter: (node) => {
        if (mode === "none") return true
        if (!(node instanceof HTMLElement)) return true
        if (node.tagName !== "IMG") return true
        const exportKind = node.getAttribute("data-export-kind")
        if (mode === "drop-avatar-remote" && exportKind !== "avatar-image") return true
        const src = (node as HTMLImageElement).src || ""
        // Keep data/blob URLs and same-origin assets; drop only true cross-origin images.
        if (!src) return true
        if (src.startsWith("data:") || src.startsWith("blob:")) return true
        try {
          const parsed = new URL(src, window.location.href)
          return parsed.origin === window.location.origin
        } catch {
          // If parsing fails, keep it instead of over-filtering.
          return true
        }
      },
    })
    return dataUrl
  }, [])

  const generateWithFallback = useCallback(async (): Promise<string | null> => {
    try {
      return await generatePngDataUrl("none")
    } catch {
      try {
        await waitForNextFrame()
        return await generatePngDataUrl("drop-avatar-remote")
      } catch {
        await waitForNextFrame()
        return await generatePngDataUrl("drop-all-remote")
      }
    }
  }, [generatePngDataUrl, waitForNextFrame])

  useLayoutEffect(() => {
    if (!open) return

    const updatePreviewFit = () => {
      if (typeof window === "undefined") return
      const dialogPadding = 64
      const maxPreviewWidth = Math.max(240, window.innerWidth - dialogPadding)
      const s = Math.min(1, maxPreviewWidth / PREVIEW_W)
      setPreviewFitScale(Math.max(0.26, s))
    }

    updatePreviewFit()
    window.addEventListener("resize", updatePreviewFit)
    window.visualViewport?.addEventListener("resize", updatePreviewFit)
    return () => {
      window.removeEventListener("resize", updatePreviewFit)
      window.visualViewport?.removeEventListener("resize", updatePreviewFit)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setPngDataUrl(null)
      return
    }

    let cancelled = false

    const capture = async () => {
      if (!cardRef.current) return
      if (cancelled) return
      setRendering(true)
      setCaptureError(null)
      try {
        const dataUrl = await generateWithFallback()
        if (!cancelled) setPngDataUrl(dataUrl)
      } catch (err) {
        if (!cancelled) {
          setPngDataUrl(null)
          setCaptureError("Unable to render card image.")
        }
        console.error("[pnl-card] capture failed", err)
      } finally {
        if (!cancelled) setRendering(false)
      }
    }

    const raf = requestAnimationFrame(() => { capture() })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [open, generateWithFallback, previewFitScale])

  const handleDownload = async () => {
    setCaptureError(null)
    let url = pngDataUrl
    if (!url) {
      setRendering(true)
      try {
        url = await generateWithFallback()
        setPngDataUrl(url)
      } catch (err) {
        setCaptureError("Download failed. Could not render image.")
        console.error("[pnl-card] download capture failed", err)
      } finally {
        setRendering(false)
      }
    }
    if (!url) {
      toast.error("Could not generate image for download")
      return
    }
    const link = document.createElement("a")
    link.download = `pnl-${data?.symbol?.toLowerCase()}.png`
    link.href = url
    link.click()
  }

  const handleCopy = async () => {
    setCaptureError(null)
    let url = pngDataUrl
    if (!url) {
      setRendering(true)
      try {
        url = await generateWithFallback()
        setPngDataUrl(url)
      } catch (err) {
        setCaptureError("Copy failed. Could not render image.")
        console.error("[pnl-card] copy capture failed", err)
      } finally {
        setRendering(false)
      }
    }
    if (!url) {
      toast.error("Could not generate image for copy")
      return
    }
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setCaptureError("Copy failed. Clipboard permission may be blocked.")
      toast.error("Copy failed")
      console.error("[pnl-card] copy failed", err)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-sm" />

        {/* Dialog shell — above trade bottom sheet (z-[201]); safe-area + scroll on small viewports */}
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[221] flex max-h-[min(92dvh,calc(100svh-1.5rem))] w-[calc(100vw-1.25rem)] max-w-[min(980px,calc(100vw-1.25rem))] min-w-0 -translate-x-1/2 -translate-y-1/2 flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-[20px] border border-[#2a2a2a] bg-[#141414] p-3 shadow-2xl outline-none sm:max-h-[min(94dvh,900px)] sm:rounded-[24px] sm:p-4"
          onEscapeKeyDown={() => onOpenChange(false)}
        >
          <DialogPrimitive.Title className="sr-only">PnL Card</DialogPrimitive.Title>

          {/* Close */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-2 top-2 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4 sm:top-4 sm:size-8"
          >
            <X size={16} />
          </button>

          {/* Scale-down wrapper — half-size design; previewFitScale shrinks on phones; export stays 1920×1080.
              min-w-0: inner canvas is 1920px intrinsic width; without this, flex min-width:auto widens the dialog (x scroll). */}
          <div
            className="mx-auto min-w-0 shrink-0 overflow-hidden rounded-[12px] sm:rounded-[16px]"
            style={{
              width: PREVIEW_W * previewFitScale,
              height: PREVIEW_H * previewFitScale,
            }}
          >
            <div
              className="min-w-0"
              style={{
                transform: `scale(${0.5 * previewFitScale})`,
                transformOrigin: "top left",
              }}
            >

              {/* ── Card canvas — all layers absolutely positioned ── */}
              <div
                ref={cardRef}
                style={{
                  position: "relative",
                  width: CARD_W,
                  height: CARD_H,
                  overflow: "hidden",
                  borderRadius: 16,
                  color: "#ffffff",
                  backgroundColor: "#0d0d0d",
                  border: "1px solid #2a2a2a",
                }}
              >
                {/* ── z0: background ── */}
                <LayerBgLines />
                <LayerRadialBlob isPositive={data?.isPositive ?? true} />

                {/* ── z1: large floating badges (4 corners / sides) ── */}
                {/* Bottom-left large */}
                <LayerFloatingBadge
                  size={334}
                  rotation="-13.47deg"
                  positionStyle={{ left: "4.74%", top: 611 }}
                  isPositive={data?.isPositive ?? true}
                />
                {/* Top-right large */}
                <LayerFloatingBadge
                  size={334}
                  rotation="10.21deg"
                  positionStyle={{ right: "5.17%", top: 46 }}
                  isPositive={data?.isPositive ?? true}
                />
                {/* Right-mid medium, blurred */}
                <LayerFloatingBadge
                  size={156}
                  rotation="13.34deg"
                  blur="3.5px"
                  opacity="0.5"
                  positionStyle={{ left: "78.07%", top: 730 }}
                  isPositive={data?.isPositive ?? true}
                />
                {/* Top-left small, blurred */}
                <LayerFloatingBadge
                  size={96}
                  rotation="-12.13deg"
                  blur="2.2px"
                  opacity="0.5"
                  positionStyle={{ left: "11.39%", top: 315 }}
                  isPositive={data?.isPositive ?? true}
                />

                {/* ── z2: logo top-left ── */}
                <LayerLogo />

                {/* ── z3: decorative rays behind token ── */}
                <LayerTokenRays />

                {/* ── z5: token image ── */}
                <LayerTokenImage
                  imageUrl={proxiedTokenImageUrl}
                  symbol={data?.symbol || ""}
                />

                {/* ── z6: ticker / symbol badge ── */}
                <LayerTickerBadge symbol={data?.symbol || ""} />

                {/* ── z8: PNL pills ── */}
                <LayerPnlPillMain pnlPercent={data?.pnlPercent || ""} isPositive={data?.isPositive ?? true} />
                <LayerPnlPillChange pnlChange={data?.pnlChange} isPositive={data?.isPositive ?? true} />

                {/* ── z9: stat cards + username ── */}
                <LayerStatCards entryPrice={data?.entryPrice || ""} exitPrice={data?.exitPrice || ""} />
                <LayerUsernamePill
                  username={data?.username || ""}
                  avatarUrl={proxiedAvatarUrl || undefined}
                />
              </div>

            </div>{/* /scale */}
          </div>{/* /scale wrapper */}

          {/* ── Action buttons ── */}
          <div className="mt-3 flex min-w-0 shrink-0 touch-manipulation gap-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleDownload}
              disabled={rendering}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#2a2a2a] bg-[#1e1e1e] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={15} />
              {rendering ? "Preparing…" : "Download"}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={rendering}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#2a2a2a] bg-[#1e1e1e] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
              {copied ? "Copied!" : rendering ? "Preparing…" : "Copy"}
            </button>
          </div>
          {captureError && <p className="mt-2 text-center text-xs text-red-300">{captureError}</p>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
