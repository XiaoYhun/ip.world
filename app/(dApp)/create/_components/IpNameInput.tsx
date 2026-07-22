import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { RefCallBack } from "react-hook-form"
import Spinner from "@/components/ui/spinner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { MOCK_IP } from "@/constants/mockData"
import { CheckIcon, XIcon } from "lucide-react"
import { Ip } from "@/types/ip"
import { getAPIRootUrl } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Search } from "@/components/icons/search"
import CategoryPills from "@/components/category-pills"
import IpItem from "./IpItem"

interface IpExistsResponse {
  exists: boolean
  title: string
  suggestions: Ip[]
}

const fetchIpName = async (name: string): Promise<IpExistsResponse> => {
  const response = await fetch(`${getAPIRootUrl()}/ips/exists?title=${encodeURIComponent(name)}&limit=5`)
  if (!response.ok) {
    throw new Error("Failed to fetch IP name")
  }
  return response.json()
}

export default function IpNameInput({
  ref,
  onSelectNewTopic,
  onSelectIp,
  ...props
}: {
  ref: RefCallBack
  onSelectNewTopic?: (ipName: string) => void
  onSelectIp?: (ip: Ip) => void
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [open, setOpen] = useState(false)
  const [width, setWidth] = useState(192)

  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const firstRenderRef = useRef(true)

  // Debounced value for API calls
  const [debouncedValue, setDebouncedValue] = useState<string | undefined>(props.value as string)

  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(props.value as string)
    }, 500) // 500ms debounce delay

    return () => {
      clearTimeout(timer)
    }
  }, [props.value])

  const { data: ipCheckResult, isFetching } = useQuery({
    queryKey: ["search-exists-ip", debouncedValue],
    queryFn: () => {
      if (debouncedValue) {
        return fetchIpName(debouncedValue)
      }
    },
    enabled: !!debouncedValue && debouncedValue.trim().length > 0,
  })

  const isOpen = open
  const isTyping = props.value !== debouncedValue
  const isLoading = isFetching || isTyping
  const isAvailable = !!props.value && ipCheckResult && !isLoading && !ipCheckResult.exists
  const suggestions = ipCheckResult?.suggestions || []

  // Handle selecting "Create new IP"
  const handleSelectNewTopic = useCallback(() => {
    if (debouncedValue && isAvailable) {
      onSelectNewTopic?.(debouncedValue)
      setOpen(false)
    }
  }, [debouncedValue, isAvailable, onSelectNewTopic])

  useEffect(() => {
    if (inputRef.current) {
      setWidth(inputRef.current.getBoundingClientRect().width)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      firstRenderRef.current = false
    }, 500)
  }, [])

  useEffect(() => {
    if (firstRenderRef.current) return
    if (isAvailable || suggestions.length > 0) {
      setOpen(true)
    }
  }, [isAvailable, suggestions])

  return (
    <Popover open={isOpen as boolean} onOpenChange={(newOpen) => !newOpen && setOpen(newOpen)}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <div className="relative w-full [&>input]:w-full">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Search size={14} />
          </div>
          <input
            ref={(element) => {
              inputRef.current = element
              if (typeof ref === "function") {
                ref(element)
              }
            }}
            name="title"
            className={cn(
              "h-[41px] w-full rounded-[8px] border bg-neutral-800 pl-9 pr-4 outline-none placeholder:text-neutral-300"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isAvailable) {
                e.preventDefault()
                handleSelectNewTopic()
              }
              props.onKeyDown?.(e)
            }}
            {...props}
            value={props.value ?? ""}
          />
          <div className="absolute top-0 right-0 bottom-0 flex w-fit items-center justify-center px-2">
            {isLoading ? (
              <Spinner size={16} />
            ) : (
              <>
                {isAvailable && (
                  <span className="text-green-neon">
                    <CheckIcon size={16} />
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        className="relative w-full border-none bg-transparent p-0 shadow-none"
        style={{ width: `${width}px` }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Prevent closing when clicking on the input
          if (inputRef.current && e.target === inputRef.current) {
            e.preventDefault()
          }
        }}
      >
        {isAvailable && suggestions.length === 0 ? (
          <div 
            className="animate-in fade-in-0 zoom-in-95 relative flex w-full items-center gap-3 rounded-[12px] border border-neutral-400 bg-neutral-700 p-4 duration-300 cursor-pointer hover:bg-neutral-600 transition-colors"
            onClick={handleSelectNewTopic}
          >
            <div className="-mb-0.5 text-sm font-medium text-neutral-300">Create new IP</div>
            <div className="rounded-[8px] bg-purple-500 px-2 py-1.5 text-sm font-medium text-white">
              {debouncedValue}
            </div>
            <div className="absolute top-0 right-4 flex h-full items-center gap-1 font-mono text-xs text-neutral-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M10.0373 6.58775C10.2651 6.81554 10.2651 7.18479 10.0373 7.41258L6.82892 10.6209L6.00409 9.79608L8.21661 7.5835H1.1665V6.41683H8.21661L6.00409 4.20426L6.82892 3.37939L10.0373 6.58775ZM12.8332 10.5002H11.6665V3.50016H12.8332V10.5002Z"
                  fill="#494949"
                />
              </svg>
              <span>Enter to select</span>
            </div>
          </div>
        ) : (
          suggestions.length > 0 && (
            <div
              className="rounded-[12px] border bg-neutral-700 p-2"
              style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.50)" }}
            >
              <div 
                className="animate-in fade-in-0 zoom-in-95 relative flex w-full items-center gap-3 rounded-[8px] border-neutral-400 bg-neutral-600 p-2 duration-300 cursor-pointer hover:bg-neutral-500 transition-colors"
                onClick={handleSelectNewTopic}
              >
                <div className="-mb-0.5 text-sm font-medium text-neutral-300">Create new IP</div>
                <div className="rounded-[8px] bg-purple-500 px-2 py-1.5 text-sm font-medium text-white">
                  {debouncedValue}
                </div>
                <div className="absolute top-0 right-4 flex h-full items-center gap-1 font-mono text-xs text-neutral-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M10.0373 6.58775C10.2651 6.81554 10.2651 7.18479 10.0373 7.41258L6.82892 10.6209L6.00409 9.79608L8.21661 7.5835H1.1665V6.41683H8.21661L6.00409 4.20426L6.82892 3.37939L10.0373 6.58775ZM12.8332 10.5002H11.6665V3.50016H12.8332V10.5002Z"
                      fill="#494949"
                    />
                  </svg>
                  <span>Enter to select</span>
                </div>
              </div>
              {suggestions.map((ip) => (
                <IpItem 
                  key={ip.id} 
                  ip={ip} 
                  onClick={(selectedIp) => {
                    onSelectIp?.(selectedIp)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          )
        )}
      </PopoverContent>
    </Popover>
  )
}
