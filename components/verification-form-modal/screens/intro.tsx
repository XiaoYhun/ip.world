import IPCard from "@/app/(dApp)/create/_components/IPCard"
import { Ip } from "@/types/ip"

const titleCase = (s: string) => s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")

export default function IntroScreen({ ip }: { ip: Ip }) {
  const ipName = titleCase(ip.title)
  const ticker = ip.remixes?.[0]?.symbol ? `$${ip.remixes[0].symbol}` : null
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      <div className="font-archivo text-[32px] font-semibold">Verify {ipName}</div>
      <IPCard ip={ip} />
      <div className="max-w-[400px] text-center text-neutral-100">
        Verify as the {ip.type === "creator" ? "creator" : "community"} behind {ipName} to start earning {ip.type === "creator" ? "creator" : "community"} rewards
      </div>
    </div>
  )
}
