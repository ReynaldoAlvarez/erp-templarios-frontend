"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// Field variants
const fieldVariants = cva("grid gap-2", {
  variants: {
    orientation: {
      vertical: "grid gap-2",
      horizontal: "grid grid-cols-[auto_1fr] items-center gap-2",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

// Field Group - groups multiple fields
function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("grid gap-4", className)}
      {...props}
    />
  )
}

// Field - wrapper for label, input, description, and error
function Field({
  className,
  orientation,
  "data-invalid": dataInvalid,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      data-slot="field"
      data-invalid={dataInvalid}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

// Field Label
function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("text-gray-700", className)}
      {...props}
    />
  )
}

// Field Description
function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

// Field Error - displays error messages
interface FieldErrorProps extends React.ComponentProps<"p"> {
  errors?: Array<{ message?: string } | undefined | null>
}

function FieldError({ className, errors, ...props }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null

  const errorMessages = errors
    .filter((e) => e?.message)
    .map((e) => e!.message)

  if (errorMessages.length === 0) return null

  return (
    <p
      data-slot="field-error"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {errorMessages.join(", ")}
    </p>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  fieldVariants,
}
