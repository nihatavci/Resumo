"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center cursor-pointer",
      className
    )}
    step={1}
    minStepsBetweenThumbs={1}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-2 w-full grow overflow-hidden rounded-full bg-dia-divider hover:bg-dia-button transition-colors duration-200"
    >
      <SliderPrimitive.Range
        className="absolute h-full bg-foreground transition-colors duration-200"
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border-2 border-foreground bg-white ring-offset-2
        shadow-dia
        transition-all duration-200
        hover:scale-110
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground
        active:scale-105
        disabled:pointer-events-none disabled:opacity-50
        cursor-grab active:cursor-grabbing
        data-[dragging=true]:cursor-grabbing"
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
