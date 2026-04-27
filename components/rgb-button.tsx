"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "ghost" | "outline"

interface RgbButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  asChild?: boolean
}

/**
 * RgbButton — primary CTA button with a subtle RGB ripple effect on click
 * and an animated conic-gradient ring on hover/focus.
 *
 * Implementation uses pure CSS classes defined in globals.css:
 *  - `.rgb-button` triggers the animated `.rgb-ring`
 *  - On click, a `.ripple-wave` span is appended at the click coordinates
 */
export const RgbButton = React.forwardRef<HTMLButtonElement, RgbButtonProps>(
  ({ className, variant = "primary", onClick, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ripple = document.createElement("span")
      ripple.className = "ripple-wave"
      const size = Math.max(rect.width, rect.height)
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`

      button.appendChild(ripple)
      window.setTimeout(() => ripple.remove(), 750)

      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "rgb-button relative overflow-hidden inline-flex items-center justify-center gap-2",
          "rounded-md px-4 py-2 text-sm font-medium font-mono tracking-tight",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-primary text-primary-foreground hover:brightness-110",
          variant === "outline" &&
            "bg-card text-foreground border border-border hover:bg-accent",
          variant === "ghost" &&
            "bg-transparent text-foreground hover:bg-accent",
          className,
        )}
        {...props}
      >
        <span className="rgb-ring" aria-hidden />
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </button>
    )
  },
)
RgbButton.displayName = "RgbButton"
