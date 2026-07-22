"use client"

import { X } from "lucide-react"
import { toast } from "sonner"

type ToastVariant = "success" | "error" | "clipboard"

const VARIANT_CONFIG: Record<ToastVariant, { bg: string; iconBg: string; iconColor: string; icon: React.ReactNode }> = {
  clipboard: {
    bg: "#191919",
    iconBg: "#321F4D",
    iconColor: "#C093FF",
    icon: (
      <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip_toast_copy)">
          <path d="M9.98975 11.88H4.10992C3.60867 11.88 3.12797 11.6809 2.77352 11.3265C2.4191 10.972 2.21997 10.4913 2.21997 9.99003V4.11018C2.21997 3.60893 2.4191 3.12825 2.77352 2.7738C3.12797 2.41938 3.60867 2.22025 4.10992 2.22025H9.98975C10.491 2.22025 10.9717 2.41938 11.3262 2.7738C11.6806 3.12825 11.8797 3.60893 11.8797 4.11018V9.99003C11.8797 10.4913 11.6806 10.972 11.3262 11.3265C10.9717 11.6809 10.491 11.88 9.98975 11.88Z" fill="currentColor" />
          <path d="M3.48017 1.37998H9.67187C9.54119 1.01175 9.29977 0.692978 8.98077 0.467403C8.66175 0.241828 8.2808 0.120478 7.89004 0.120003H2.01022C1.50897 0.120003 1.02824 0.319128 0.67382 0.673553C0.319395 1.02798 0.12027 1.5087 0.12027 2.00995V7.8898C0.120745 8.2805 0.242095 8.6615 0.46767 8.9805C0.693245 9.2995 1.01202 9.54095 1.38022 9.67158V3.47993C1.38022 2.92298 1.60147 2.38883 1.99527 1.99503C2.38909 1.6012 2.92324 1.37998 3.48017 1.37998Z" fill="currentColor" />
        </g>
        <defs><clipPath id="clip_toast_copy"><rect width="12" height="12" fill="white" /></clipPath></defs>
      </svg>
    ),
  },
  success: {
    bg: "#191919",
    iconBg: "#1A3A1A",
    iconColor: "#4ADE80",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    bg: "#191919",
    iconBg: "#3A1A1A",
    iconColor: "#F87171",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
}

export function showToast({
  variant = "success",
  title,
  description,
}: {
  variant?: ToastVariant
  title: string
  description?: string
}) {
  const config = VARIANT_CONFIG[variant]
  toast.custom((id) => (
    <div className="flex w-[326px] items-center gap-3.5 rounded-[12px] border border-[#303030] p-3" style={{ backgroundColor: config.bg }}>
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: config.iconBg, color: config.iconColor }}
      >
        {config.icon}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="text-sm font-semibold leading-none text-white">{title}</div>
        {description && (
          <div className="text-xs font-normal leading-none text-[#B3B3B3]">{description}</div>
        )}
      </div>
      <button onClick={() => toast.dismiss(id)} className="shrink-0 cursor-pointer p-1 text-[#484848] transition-colors hover:text-neutral-300">
        <X size={14} />
      </button>
    </div>
  ))
}
