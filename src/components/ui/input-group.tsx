"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Input Group - wrapper for input with addons
function InputGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn("relative flex", className)}
      {...props}
    />
  )
}

// Input Group Addon - for icons, buttons, etc.
function InputGroupAddon({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end" | "block-start" | "block-end"
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex items-center justify-center",
        align === "start" && "absolute left-0 top-0 bottom-0 z-10",
        align === "end" && "absolute right-0 top-0 bottom-0 z-10",
        align === "block-start" && "w-full",
        align === "block-end" && "w-full",
        className
      )}
      {...props}
    />
  )
}

// Input Group Text - for displaying text in addon
function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        "flex items-center justify-center text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

// Input Group Textarea - for textarea in input group
function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="input-group-textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
}
