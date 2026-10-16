import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Dot } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_DOT } from "@/components/shared/badges";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, type Stage } from "@/types";

/** One Kanban column: header ribbon (dot, label, count) + droppable card list. */
export function StageColumn({
  stage,
  count,
  loading,
  collapsed,
  children,
}: {
  stage: Stage;
  count: number;
  loading: boolean;
  /** Only the header ribbon is shown when the pipeline is empty. */
  collapsed: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section ref={setNodeRef} aria-label={`${STAGE_LABELS[stage]}, ${count} candidates`} className="flex flex-col gap-3">
      <div
        className={cn(
          "flex items-center justify-between rounded-lg bg-surface-container-low px-3.5 py-3 shadow-[0_2px_6px_rgb(70_60_45/0.03)] transition-colors",
          isOver && "bg-primary-fixed",
        )}
      >
        <div className="flex items-center gap-2">
          <Dot className={cn("size-2.5", STAGE_DOT[stage])} />
          <h2 className="type-headline-sm text-[15px] text-on-surface">{STAGE_LABELS[stage]}</h2>
        </div>
        <span className="rounded-full bg-surface-container-high px-2 py-0.5 type-label-sm text-on-surface-variant tabular-nums">
          {loading ? "–" : count}
        </span>
      </div>
      {!collapsed && (
        <div
          className={cn(
            "flex min-h-[62vh] flex-1 flex-col gap-2.5 rounded-lg bg-surface-container-low/60 p-2 shadow-[inset_0_2px_6px_rgb(70_60_45/0.03)] transition-all",
            isOver && "bg-primary-fixed/40 ring-2 ring-primary-container/40",
          )}
        >
          {loading ? (
            Array.from({ length: stage === "applied" ? 3 : 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-surface-container-lowest" />
            ))
          ) : count === 0 ? (
            <div className="flex flex-1 items-start justify-center pt-8 type-label-sm text-on-surface-variant/80 uppercase">
              Drop here
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
}
