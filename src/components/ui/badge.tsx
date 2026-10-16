import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Mono uppercase pill used for statuses, scores and tags across the designs. */
const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 type-label-sm whitespace-nowrap uppercase [&>svg]:size-3",
  {
    variants: {
      variant: {
        primary: "bg-primary-container text-on-primary",
        "primary-soft": "bg-primary-fixed text-on-primary-fixed",
        success: "bg-secondary-container text-on-secondary-fixed",
        tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
        danger: "bg-error-container text-on-error-container",
        neutral: "bg-surface-container-high text-on-surface-variant",
        outline: "bg-surface-container-lowest text-on-surface shadow-clay-sm",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Small colored dot that prefixes many badges in the designs. */
function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", className)} />;
}

export { Badge, Dot, badgeVariants };
