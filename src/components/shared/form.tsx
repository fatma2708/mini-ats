import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Form field: label + optional right-aligned mono hint.
 * `caps` uses the mono uppercase label style of the drawer and admin designs.
 */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
  className,
  caps = false,
  aside,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
  caps?: boolean;
  /** Element shown at the right of the label (e.g. "Generate" link). */
  aside?: ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className={caps ? "type-label-sm text-on-surface-variant uppercase" : "type-body-md-bold text-on-surface"}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {aside ?? (hint && <span className="type-label-sm text-on-surface-variant uppercase">{hint}</span>)}
      </div>
      {children}
    </div>
  );
}

/** Wraps an input with a leading icon placed inside the well. */
export function WithIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex items-center [&_input]:pl-11">
      <span className="pointer-events-none absolute left-3.5 flex text-outline [&_svg]:size-[18px]" aria-hidden="true">
        {icon}
      </span>
      {children}
    </div>
  );
}
