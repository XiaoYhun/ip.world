"use client"

import TokenExplorer from "@/components/remixes/token-explorer"
import { Remix } from "@/types/remix"

type HomepageRemixesProps = {
  initialRemixes: Remix[]
  total: number
}

export default function HomepageRemixes({ initialRemixes, total }: HomepageRemixesProps) {
  return (
    <TokenExplorer
      initialRemixes={initialRemixes}
      total={total}
      sticky
      defaultFiltersExpanded={false}
    />
  )
}
