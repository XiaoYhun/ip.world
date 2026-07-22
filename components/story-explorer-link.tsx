import Link from "next/link"
import { Address } from "viem"
import { env } from "@/config"

const StoryExplorerLink = ({
  children,
  address,
  type = "address",
}: {
  children: React.ReactNode
  address: Address
  type?: "address" | "tx"
}) => {
  const link = `${env.NEXT_PUBLIC_EXPLORER_URL.endsWith("/") ? env.NEXT_PUBLIC_EXPLORER_URL : `${env.NEXT_PUBLIC_EXPLORER_URL}/`}${type}/${address}`

  return (
    <Link href={link} target="_blank" rel="noopener noreferrer">
      {children}
    </Link>
  )
}

export default StoryExplorerLink
