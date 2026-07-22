"use client"

import TokenExplorer from "@/components/remixes/token-explorer"
import { Remix } from "@/types/remix"

type RemixesClientProps = {
  initialRemixes: Remix[]
  total: number
}

export default function RemixesClient({ initialRemixes, total }: RemixesClientProps) {
  return (
    <TokenExplorer
      initialRemixes={initialRemixes}
      total={total}
      sticky
      defaultFiltersExpanded={true}
      gridClassName="pb-16"
    />
  )
}
