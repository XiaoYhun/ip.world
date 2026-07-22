"use client"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "@/components/icons"

const BackToSearch = () => {
  const router = useRouter()
  return (
    <div
      className="hover:text-neutral-200 hidden cursor-pointer items-center gap-1 text-neutral-300 transition-all md:flex"
      onClick={() => router.push("/create/search")}
    >
      <ArrowLeft size={8} />
      <span className="text-xs">Back to IP Search</span>
    </div>
  )
}

export default BackToSearch
