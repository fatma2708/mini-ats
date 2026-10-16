import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full type-body-md-bold transition-all outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Primary action: indigo pill with soft glow (bg-primary-container in the designs). */
        default:
          "bg-primary-container text-on-primary shadow-primary hover:bg-primary hover:-translate-y-0.5 active:translate-y-0",
        /** Neutral raised pill (Cancel, secondary actions). */
        secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
        /** White clay pill on tinted surfaces. */
        outline: "bg-surface-container-lowest text-on-surface shadow-clay-sm hover:bg-surface-container-high",
        ghost: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
        destructive: "text-error hover:bg-error-container/70",
        "destructive-solid": "bg-error text-on-error hover:bg-on-error-container",
        link: "rounded-md text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 gap-1.5 px-3.5 type-body-sm font-semibold [&_svg]:size-4",
        lg: "h-12 px-7",
        icon: "size-9",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
