import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/shared/PageHeader";

/** Large tactile empty state with a clay "stamp" icon (open.html / pipeline.html). */
export function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-2xl bg-surface-container-lowest text-center shadow-clay",
        compact ? "px-6 py-10" : "px-6 py-14 sm:px-12 sm:py-16",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-16 -left-16 size-64 rounded-full bg-primary-fixed/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-10 size-56 rounded-full bg-secondary-fixed/40 blur-3xl" />
      {icon && (
        <div className={cn("relative flex items-center justify-center", compact ? "mb-4" : "mb-6")}>
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl bg-surface-container-low shadow-[inset_0_2px_4px_rgb(70_60_45/0.06),0_1px_1px_rgb(255_255_255/0.85)]",
              compact ? "size-16" : "size-24",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-lg bg-primary-container text-on-primary shadow-[0_6px_16px_rgb(59_63_216/0.25)]",
                compact ? "size-11 [&_svg]:size-5" : "size-16 [&_svg]:size-8",
              )}
            >
              {icon}
            </div>
          </div>
        </div>
      )}
      <div className="relative flex max-w-xl flex-col items-center">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h3 className={cn("text-on-surface", compact ? "type-headline-sm" : "type-headline-md sm:type-headline-lg")}>
          {title}
        </h3>
        {description && (
          <p className={cn("mt-2 text-on-surface-variant", compact ? "type-body-sm" : "type-body-lg")}>{description}</p>
        )}
        {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
      </div>
    </div>
  );
}
