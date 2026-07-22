"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NavMenu = () => {
  const pathname = usePathname()

  const navItems = [
    { href: "/coins", label: "Explore Tokens" },
    { href: "/", label: "IPs" },
  ]

  return (
    <div className="hidden gap-6 md:flex">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm transition-all",
            pathname === item.href
              ? "text-primary"
              : "text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export default NavMenu
