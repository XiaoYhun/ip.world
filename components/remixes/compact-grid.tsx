"use client"

import { Remix } from "@/types/remix"
import RemixCompactGridItem from "./compact-grid-item"

const RemixCompactGrid = ({ remixes }: { remixes: Remix[] }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {remixes.map((item) => (
        <RemixCompactGridItem remix={item as Remix} key={`remix-${item.id}`} />
      ))}
    </div>
  )
}

export default RemixCompactGrid
