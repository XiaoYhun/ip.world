"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import * as React from "react"

import { cn } from "@/lib/utils"

const MotionButton = motion.button
const MotionSlot = motion.create(Slot)

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive-gradient text-white shadow-xs",
        outline: "shadow-xs !bg-background !border-white !border",
        primary: "bg-purple-200 text-purple-700 shadow-xs transition-all hover:bg-purple-300",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-neutral-600",
        link: "text-primary underline-offset-4 hover:underline",
        "pattern-1": "bg-pattern-1 text-primary-foreground",
        "pattern-2": "text-primary-foreground text-white",
        "pattern-3": "bg-pattern-3 text-white",
        grey: "border !bg-neutral-600 hover:!bg-neutral-300 text-neutral-200 hover:text-white",
        "outline-2":
          "!bg-background hover:!bg-neutral-2000 active:!bg-neutral-600 text-neutral-200 hover:text-white border",
        purple: "bg-purple-200 text-purple-700 shadow-xs transition-all hover:bg-purple-300",
        "purple-1":
          "button-primary transition-all text-neutral-5 shadow-xs disabled:bg-neutral-600 disabled:!text-neutral-300",
        "grey-gradient": "backdrop-blur-2xl button-grey-gradient border-[0.0313rem] border-neutral-300",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 rounded-[6px] gap-1 px-2 has-[>svg]:px-2",
        sm: "h-8 rounded-[6px] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[6px] px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
      disabled: {
        true: "opacity-50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  const [isHovered, setIsHovered] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const fillRef = React.useRef<HTMLDivElement>(null)
  const cursorPosRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const animationRef = React.useRef<gsap.core.Tween | null>(null)

  const Comp = asChild ? MotionSlot : MotionButton

  // Directional fill effect for Create Take button
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant !== "outline" || !buttonRef.current || !fillRef.current) return

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill()
    }

    const button = buttonRef.current
    const fill = fillRef.current
    const rect = button.getBoundingClientRect()

    // Kill any ongoing animations to prevent conflicts
    gsap.killTweensOf(fill)

    // Calculate cursor position relative to button
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Store cursor position for exit animation
    cursorPosRef.current = { x, y }

    // Calculate the maximum distance to ensure circle covers entire button
    const maxDistance = Math.sqrt(Math.pow(Math.max(x, rect.width - x), 2) + Math.pow(Math.max(y, rect.height - y), 2))

    // Choose fill color based on variant
    const fillColor = variant === "outline" ? "white" : "#AD74FE"

    // Set initial circle at cursor position with 0 radius
    gsap.set(fill, {
      background: `radial-gradient(circle at ${x}px ${y}px, ${fillColor} 0%, ${fillColor} 0%, transparent 0%)`,
    })

    // Animate circle expanding from cursor position
    animationRef.current = gsap.to(fill, {
      background: `radial-gradient(circle at ${x}px ${y}px, ${fillColor} ${maxDistance}px, ${fillColor} ${maxDistance}px, transparent ${maxDistance}px)`,
      duration: 0.4,
      ease: "power2.out",
    })

    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    if (variant !== "outline" || !fillRef.current) return

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill()
    }

    const { x, y } = cursorPosRef.current

    // Kill any ongoing animations to prevent conflicts
    gsap.killTweensOf(fillRef.current)

    // Choose fill color based on variant
    const fillColor = variant === "outline" ? "white" : "#AD74FE"

    // Animate circle shrinking back to original cursor position
    animationRef.current = gsap.to(fillRef.current, {
      background: `radial-gradient(circle at ${x}px ${y}px, ${fillColor} 0%, ${fillColor} 0%, transparent 0%)`,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        // Ensure background is fully transparent when animation completes
        if (fillRef.current) {
          gsap.set(fillRef.current, { background: "transparent" })
        }
      },
    })

    setIsHovered(false)
  }

  if (variant === "primary" || variant === "purple-1" || variant === "pattern-1") {
    return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
  }

  if (variant === "outline") {
    return (
      <Comp
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          buttonVariants({ variant, size, className }),
          isHovered ? "!text-black" : "!text-white",
          "relative overflow-hidden"
        )}
        {...props}
      >
        <div
          ref={fillRef}
          className="absolute inset-0 z-[0]"
          style={{
            background: "transparent",
          }}
        />
        <span className={`relative z-10 transition-colors duration-300 ${isHovered ? "text-black" : "text-white"}`}>
          {props?.children}
        </span>
      </Comp>
    )
  }

  if (variant === "pattern-2") {
    return (
      <Comp
        ref={buttonRef}
        data-slot="button"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{
          background: "linear-gradient(180deg, #B988FE 0%, #842DFF 100%)",
          boxShadow: isHovered ? "0 0 20px rgba(173,116,254,0.5)" : "none",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          buttonVariants({ variant, size, className }),
          "relative flex items-center justify-center overflow-hidden"
        )}
        {...props}
      >
        {/* Container for pattern and wave effect */}
        <div className="absolute inset-0 h-full w-full overflow-hidden rounded-[7px]">
          {/* Static halftone pattern */}
          <div className="bg-halftone-pattern absolute inset-0" />

          {/* Expanding ring wave effect */}
          {isHovered && (
            <div
              className="animate-torus-expand"
              style={{
                left: "50%",
                top: "50%",
              }}
            />
          )}
        </div>

        <motion.span className="relative z-10" animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {props?.children}
        </motion.span>
      </Comp>
    )
  }

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
