import type { ReactNode } from "react";
import { KanbanSquare } from "lucide-react";
import { Badge, Dot } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import type { Recommendation, Stage } from "@/types";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-[0_4px_12px_rgb(30_29_194/0.25)]">
        <KanbanSquare className="size-5" aria-hidden="true" />
      </span>
      {!compact && <span className="type-headline-sm text-on-surface">Mini ATS</span>}
    </span>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn("size-4", className)}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/** Score color bands: green ≥ 75, lavender 50–74, red below. */
export function scoreVariant(score: number) {
  if (score >= 75) return "success" as const;
  if (score >= 50) return "tertiary" as const;
  return "danger" as const;
}

export const SCORE_SURFACE: Record<ReturnType<typeof scoreVariant>, string> = {
  success: "bg-secondary-container text-on-secondary-fixed",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
  danger: "bg-error-container text-on-error-container",
};

export function ScoreBadge({ score, className }: { score: number | null; className?: string }) {
  if (score === null || score === undefined) return null;
  return (
    <Badge variant={scoreVariant(score)} className={className} title={`AI score ${score}/100`}>
      {score} match
    </Badge>
  );
}

const RECOMMENDATION: Record<Recommendation, { label: string; variant: "success" | "tertiary" | "danger"; dot: string }> =
  {
    advance: { label: "Advance candidate", variant: "success", dot: "bg-secondary" },
    maybe: { label: "Maybe", variant: "tertiary", dot: "bg-tertiary-container" },
    reject: { label: "Reject", variant: "danger", dot: "bg-error" },
  };

export function RecommendationBadge({ value }: { value: Recommendation }) {
  const r = RECOMMENDATION[value] ?? { label: value, variant: "tertiary" as const, dot: "bg-tertiary" };
  return (
    <Badge variant={r.variant} className="px-3 py-1">
      <Dot className={r.dot} />
      {r.label}
    </Badge>
  );
}

/** Dot color of each pipeline stage (pipeline.html column headers). */
export const STAGE_DOT: Record<Stage, string> = {
  applied: "bg-outline-variant",
  screening: "bg-tertiary-fixed-dim",
  interview: "bg-primary-fixed-dim",
  offer: "bg-secondary-fixed-dim",
  hired: "bg-secondary",
  rejected: "bg-error",
};

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed type-body-md-bold text-on-primary-fixed shadow-clay-sm",
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}

/** Mono uppercase overline used above titles and sections. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("type-label-sm text-on-surface-variant uppercase", className)}>{children}</span>;
}

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
