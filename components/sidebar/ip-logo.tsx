import Link from "next/link"
import { Logo, LogoText } from "../icons"

const IpLogo = () => {
  return (
    <Link href="/" className="mb-[14px] flex w-full flex-nowrap items-center gap-5">
      <div className="h-8 w-8">
        <Logo size={32} />
      </div>
      <div
        className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden"
        data-id="ItemContent"
      >
        <LogoText />
      </div>
    </Link>
  )
}

export default IpLogo
