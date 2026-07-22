"use client"
import { usePathname } from "next/navigation"
import { useMobileDrawer } from "@/context/mobile-ui-context"
import { cn } from "@/lib/utils"
import { Separator } from "../ui/separator"
import { ArrowLeft, File, Logo, Search } from "../icons"
import SearchDialog from "@/components/dialog/search-dialog"
import { useProfile } from "@/hooks/use-profile"
import { Plus, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import defaultUserImage from "@/public/images/default-user.png"

type TitleNavbarProps = {
  title?: string
  subtitle?: string
  backButton?: boolean
  onBack?: () => void
}

export function TitleNavbar({ title, subtitle, backButton = true, onBack }: TitleNavbarProps) {
  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex w-full items-center justify-between bg-black/95 px-2 py-2 shadow-md md:hidden">
      {/* Back button */}
      {backButton && (
        <button
          className="flex items-center justify-center border-none p-2 focus:outline-none"
          aria-label="Back"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
      )}
      {/* Title and subtitle */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
        {title && <span className="truncate text-base leading-tight font-semibold text-white">{title}</span>}
        {subtitle && (
          <span className="flex items-center gap-1 truncate text-xs font-medium text-neutral-200">
            {subtitle}
            <File size={12} />
          </span>
        )}
      </div>
      {/* Right spacer for symmetry */}
      <div className="w-8" />
    </div>
  )
}

export default function MobileNavbar() {
  const { toggleDrawer } = useMobileDrawer()
  const pathname = usePathname()
  const { user } = useProfile()

  const isCreatePage = /^\/create\//.test(pathname)

  if (isCreatePage) return null

  return (
    <div className="animate-in slide-in-from-top duration-300 sm:hidden">
      <nav
        className={cn(
          "border-neutral-600 bg-panel fixed top-0 right-0 left-0 z-50 flex w-screen max-w-screen items-center justify-between border-b px-3 transition-all duration-300 h-[56px]"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href="/" passHref className="flex shrink-0 items-center">
            <Logo size={24} />
          </Link>
          <SearchDialog
            trigger={
              <button
                type="button"
                className="flex h-9 min-w-0 flex-1 max-w-[200px] items-center gap-2 rounded-full border border-neutral-600 bg-neutral-800/80 px-3 py-1.5 text-left text-sm text-neutral-300 sm:max-w-none mr-2"
                aria-label="Search tokens and users"
              >
                <span className="shrink-0 text-neutral-400">
                  <Search size={16} />
                </span>
                <span className="truncate">Search</span>
              </button>
            }
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Create button */}
          <Link
            href="/create"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"
          >
            <Plus size={18} strokeWidth={2.5} />
          </Link>
          {/* Profile = menu trigger */}
          <button
            className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1"
            onClick={() => toggleDrawer()}
          >
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
              <Image
                src={user?.avatar_url || defaultUserImage}
                alt="profile"
                fill
                className="object-cover"
              />
            </div>
            {user?.username && (
              <span className="max-w-[80px] truncate text-sm font-medium text-white">
                @{user.username}
              </span>
            )}
            <ChevronRight size={16} className="shrink-0 text-neutral-400" />
          </button>
        </div>
      </nav>

      <Separator />
    </div>
  )
}
