import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { LinkedInIcon } from "@/components/shared/brand";
import { ScoreBadge } from "@/components/shared/badges";
import { cn, formatDate } from "@/lib/utils";
import { STAGE_LABELS, type CandidateWithJob } from "@/types";

/** Draggable wrapper: click or Enter opens the drawer, Space picks the card up (keyboard sensor). */
export function DraggableCard({ candidate, onOpen, hidden }: { candidate: CandidateWithJob; onOpen: () => void; hidden: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: candidate.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "touch-manipulation rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container",
        hidden && "opacity-30",
      )}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !hidden) onOpen();
        listeners?.onKeyDown?.(e);
      }}
      aria-label={`${candidate.full_name}, ${STAGE_LABELS[candidate.stage]}. Press Enter to open, Space to move.`}
    >
      <CandidateCard candidate={candidate} />
    </div>
  );
}

/** Compact card content, also rendered in the DragOverlay while dragging. */
export function CandidateCard({ candidate, lifted = false }: { candidate: CandidateWithJob; lifted?: boolean }) {
  return (
    <div
      className={cn(
        "flex cursor-grab flex-col gap-1 rounded-lg bg-surface-container-lowest p-3.5 shadow-clay-sm transition-shadow select-none hover:shadow-clay active:cursor-grabbing",
        lifted && "scale-[1.02] rotate-1 shadow-clay-lift ring-2 ring-primary-container",
        candidate.stage === "hired" && !lifted && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate type-headline-sm text-[15px] leading-snug text-on-surface">
          {candidate.full_name}
        </span>
        {candidate.linkedin_url && (
          <a
            href={candidate.linkedin_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-0.5 shrink-0 rounded-sm text-primary-container transition-opacity hover:opacity-75"
            title="LinkedIn profile"
            aria-label={`${candidate.full_name} on LinkedIn`}
          >
            <LinkedInIcon />
          </a>
        )}
      </div>
      <span className="truncate type-body-sm text-on-surface-variant">{candidate.jobs?.title ?? "—"}</span>
      <div className="mt-2 flex items-center justify-between gap-2">
        {candidate.ai_score !== null ? (
          <ScoreBadge score={candidate.ai_score} />
        ) : (
          <span className="type-label-sm text-on-surface-variant/80 uppercase">Not assessed</span>
        )}
        <span className="type-label-sm text-on-surface-variant/80">{formatDate(candidate.created_at)}</span>
      </div>
    </div>
  );
}
