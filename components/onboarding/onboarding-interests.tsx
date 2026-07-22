"use client"

import { motion } from "framer-motion"
import { CATEGORIES } from "@/lib/constants"
import { Ip } from "@/types/ip"
import { cn } from "@/lib/utils"
import Image from "@/components/image"

interface OnboardingInterestsProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onFinish: () => void
  onSkip: () => void
  selectedCategories: string[]
  selectedIps: string[]
  onToggleCategory: (category: string) => void
  onToggleIp: (ip: Ip) => void
  trendingIps: Ip[]
}

export function OnboardingInterests({
  currentStep,
  totalSteps,
  onBack,
  onFinish,
  onSkip,
  selectedCategories,
  selectedIps,
  onToggleCategory,
  onToggleIp,
  trendingIps,
}: OnboardingInterestsProps) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center px-4"
    >
      {/* Header */}
      <motion.div
        className="mb-6 flex flex-col items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className="font-archivo text-center text-xl leading-[1.2] font-semibold text-white">
          Pick what you like and we&apos;ll build your feed for you
        </h1>
      </motion.div>

      {/* Content */}
      <motion.div
        className="flex w-full max-w-[520px] flex-col gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Categories Section */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-medium tracking-wide text-neutral-400 uppercase">Categories</h2>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategories.includes(category.key)
              return (
                <button
                  key={category.key}
                  onClick={() => onToggleCategory(category.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all",
                    isSelected
                      ? "border-white bg-white text-neutral-800"
                      : "border-neutral-600 bg-[#191919] text-white hover:border-neutral-500"
                  )}
                >
                  <Icon size={12} />
                  <span className="text-xs font-medium">{category.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Trending IPs Section */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-medium tracking-wide text-neutral-400 uppercase">Trending IPs</h2>
          {trendingIps.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {trendingIps.map((ip) => {
                const isSelected = selectedIps.includes(ip.id)
                return (
                  <button
                    key={ip.id}
                    onClick={() => onToggleIp(ip)}
                    className={cn(
                      "group relative flex flex-col items-center gap-1.5 rounded-[10px] border p-2 transition-all",
                      isSelected
                        ? "border-white bg-white/10"
                        : "border-neutral-600 bg-[#191919] hover:border-neutral-500"
                    )}
                  >
                    {ip.image && (
                      <div className="relative h-12 w-12 overflow-hidden rounded-[6px]">
                        <Image src={ip.image} alt={ip.title} fill className="object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-neutral-800">
                                <path
                                  d="M8 2.5L4 6.5L2 4.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <span className="line-clamp-1 text-center text-[10px] font-medium text-white">{ip.title}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
