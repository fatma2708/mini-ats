import * as React from "react";
import { cn } from "@/lib/utils";

/** Clay "well" field: tinted, slightly inset, turns white with a ring on focus. */
export const fieldClasses =
  "w-full min-w-0 rounded-md bg-surface-container-low text-on-surface type-body-md shadow-well transition-all outline-none placeholder:text-on-surface-variant/70 focus-visible:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/70 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-error/60";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClasses,
        "h-11 px-3.5 file:border-0 file:bg-transparent file:type-body-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
