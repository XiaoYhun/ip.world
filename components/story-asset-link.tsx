import Link from "next/link"
import { Address } from "viem"
import { env } from "@/config"

const StoryAssetLink = ({ children, address, className }: { children: React.ReactNode; address: Address; className?: string }) => {
  const link = `${env.NEXT_PUBLIC_CHAIN_ID === 1514 ? "https://explorer.story.foundation" : "https://aeneid.explorer.story.foundation"}/ipa/${address}`

  return (
    <Link href={link} target="_blank" className={className}>
      {children}
    </Link>
  )
}

export default StoryAssetLink
