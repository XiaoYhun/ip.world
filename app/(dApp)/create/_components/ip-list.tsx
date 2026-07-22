import React, { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import IpSelectItem from "./ip-select-item"

type IpListProps = {
  ips: Ip[]
  searchTerm?: string
  selectedIp?: Ip
  setSelectedIp?: (ip: Ip) => void
  showExisting?: boolean
}

const IpList = ({ ips, searchTerm, selectedIp, setSelectedIp, showExisting = false }: IpListProps) => {
  const existing = searchTerm ? ips.find((ip) => ip.title === searchTerm) : null

  const filteredIps = useMemo(() => {
    if (!!selectedIp) return [selectedIp]

    if (existing) {
      return [existing, ...ips.filter((ip) => ip.title !== existing.title)]
    }

    return ips
  }, [existing, ips, selectedIp])

  return (
    <>
      <ScrollArea className={cn(filteredIps.length > 3 ? "h-96" : "h-full")}>
        {filteredIps.map((ip, index) => (
          <React.Fragment key={ip.id}>
            <IpSelectItem
              isExisting={showExisting && ip.title === searchTerm}
              ip={ip}
              onClick={() => setSelectedIp?.(ip)}
              selected={selectedIp?.id === ip.id}
            />
            {index < filteredIps.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </ScrollArea>
    </>
  )
}

export default IpList
