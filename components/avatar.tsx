import Link from "next/link"
import Image from "@/components/image"

type User = {
  address: string
  avatar: string
}

const Avatar = ({ user }: { user: User }) => {
  return (
    <Link href={`/@${user.address}`} className="flex cursor-pointer items-center gap-1">
      <Image src={user.avatar} alt={user.address} width={36} height={36} className="h-8 w-8 rounded-full" />
      <p className="text-sm hover:underline">{user.address?.slice(0, 8)}...</p>
    </Link>
  )
}

export default Avatar
