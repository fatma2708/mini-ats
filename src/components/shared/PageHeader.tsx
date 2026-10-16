import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mono uppercase overline used above titles and sections. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("type-label-sm text-on-surface-variant uppercase", className)}>{children}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  /** Small chip next to the title (count, status…). */
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 flex flex-wrap items-center gap-2">{eyebrow}</div>}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-headline-xl-mobile text-on-surface sm:type-headline-lg">{title}</h1>
          {meta}
        </div>
        {description && <p className="mt-1 max-w-2xl type-body-md text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
