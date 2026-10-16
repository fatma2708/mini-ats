import { Badge, Dot } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import type { Recommendation, Stage } from "@/types";

/** Score color bands: green ≥ 75, lavender 50–74, red below. */
export function scoreVariant(score: number) {
  if (score >= 75) return "success" as const;
  if (score >= 50) return "tertiary" as const;
  return "danger" as const;
}

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
