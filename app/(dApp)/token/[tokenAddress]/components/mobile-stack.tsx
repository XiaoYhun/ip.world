import { TitleNavbar } from "@/components/navigation/mobile-navbar"

interface MobileStackProps {
  title?: string
  subtitle?: string
}

export default function MobileStack({ title = "", subtitle = "" }: MobileStackProps) {
  return (
    <div className="z-50">
      <TitleNavbar title={title} subtitle={subtitle} />
      <div className="h-12 md:hidden" />
    </div>
  )
}
