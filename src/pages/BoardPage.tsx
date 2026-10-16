import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Briefcase, GripVertical, MousePointerClick, Plus, Search, Sparkles, UserPlus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCandidates, useJobs, useMoveCandidate } from "@/hooks/queries";
import { useJobLabel } from "@/hooks/useJobLabel";
import { Button } from "@/components/ui/button";
import { Badge, Dot } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, Eyebrow, LinkedInIcon, PageHeader, ScoreBadge, STAGE_DOT } from "@/components/common";
import { AddCandidateDialog } from "@/components/AddCandidateDialog";
import { CandidateDrawer } from "@/components/CandidateDrawer";
import { cn, formatDate } from "@/lib/utils";
import { STAGES, STAGE_LABELS, type CandidateWithJob, type Stage } from "@/types";

const ALL_JOBS = "all";

export function BoardPage() {
  const { isAdmin, customerId } = useAuth();
  const [params, setParams] = useSearchParams();
  const jobFilter = params.get("job") ?? ALL_JOBS;
  const search = params.get("q") ?? "";
  const openCandidateId = params.get("candidate");

  const { data: candidates, isPending, isError, error } = useCandidates();
  const { data: jobs = [] } = useJobs();
  const jobLabel = useJobLabel();
  const move = useMoveCandidate();
  const [addOpen, setAddOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  function updateParam(key: string, value: string | null) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: key === "q" },
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (candidates ?? []).filter(
      (c) => (jobFilter === ALL_JOBS || c.job_id === jobFilter) && (!q || c.full_name.toLowerCase().includes(q)),
    );
  }, [candidates, jobFilter, search]);

  const byStage = useMemo(() => {
    const groups = Object.fromEntries(STAGES.map((s) => [s, [] as CandidateWithJob[]])) as Record<
      Stage,
      CandidateWithJob[]
    >;
    for (const c of filtered) groups[c.stage]?.push(c);
    return groups;
  }, [filtered]);

  const sensors = useSensors(
    // A small distance lets a simple click open the drawer instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    // Space picks up / drops a card, Enter is kept for opening the drawer.
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const stage = e.over?.id as Stage | undefined;
    const candidate = candidates?.find((c) => c.id === e.active.id);
    if (!stage || !candidate || candidate.stage === stage) return;
    move.mutate({ id: candidate.id, stage });
  }

  const activeCandidate = activeId ? candidates?.find((c) => c.id === activeId) : null;
  const hasFilters = jobFilter !== ALL_JOBS || !!search;
  const noJobs = !isPending && jobs.length === 0;
  const noCandidates = !isPending && candidates?.length === 0;

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="Pipeline"
        meta={
          candidates && (
            <Badge variant="neutral">
              {filtered.length} candidate{filtered.length === 1 ? "" : "s"}
              {hasFilters ? " · filtered" : ""}
            </Badge>
          )
        }
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Add candidate
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={jobFilter} onValueChange={(v) => updateParam("job", v === ALL_JOBS ? null : v)}>
          <SelectTrigger pill className="sm:w-80" aria-label="Filter by job">
            <span className="flex min-w-0 items-center gap-2">
              <Briefcase className="size-4 shrink-0 text-outline" aria-hidden="true" />
              <span className="truncate">
                <SelectValue />
              </span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_JOBS}>All jobs</SelectItem>
            {jobs.length > 0 && <SelectSeparator />}
            {jobs.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {jobLabel(j)}
                {j.status === "closed" ? " (closed)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-outline"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => updateParam("q", e.target.value || null)}
            placeholder="Search by name…"
            aria-label="Search candidates by name"
            className="h-10 w-full rounded-full bg-surface-container-low pr-4 pl-10 type-body-sm text-on-surface shadow-well transition-all outline-none placeholder:text-on-surface-variant/80 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary-container/70 focus-visible:outline-none"
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("job");
                next.delete("q");
                return next;
              })
            }
          >
            <X /> Clear filters
          </Button>
        )}
      </div>

      {isError ? (
        <EmptyState compact title="Could not load candidates" description={error?.message} />
      ) : noJobs ? (
        <EmptyState
          icon={<Briefcase />}
          eyebrow="Pipeline · 0 jobs"
          title={isAdmin && !customerId ? "No jobs yet for any customer" : "Create your first job"}
          description="Candidates are attached to a job. Create one to start building your pipeline."
          action={
            <Button asChild size="lg">
              <Link to="/jobs?new=1">
                <Plus /> New job
              </Link>
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
            <div className="grid min-w-[1180px] grid-cols-6 gap-3">
              {STAGES.map((stage) => (
                <Column
                  key={stage}
                  stage={stage}
                  count={byStage[stage].length}
                  loading={isPending}
                  collapsed={noCandidates}
                >
                  {byStage[stage].map((c) => (
                    <DraggableCard
                      key={c.id}
                      candidate={c}
                      onOpen={() => updateParam("candidate", c.id)}
                      hidden={c.id === activeId}
                    />
                  ))}
                </Column>
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeCandidate && <CandidateCard candidate={activeCandidate} lifted />}
          </DragOverlay>
        </DndContext>
      )}

      {!isError && !noJobs && noCandidates && <EmptyPipeline onAdd={() => setAddOpen(true)} />}

      <AddCandidateDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultJobId={jobFilter !== ALL_JOBS ? jobFilter : undefined}
        onCreated={(c) => updateParam("candidate", c.id)}
      />
      <CandidateDrawer candidateId={openCandidateId} onClose={() => updateParam("candidate", null)} />
    </div>
  );
}

function Column({
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
  children: React.ReactNode;
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

function DraggableCard({ candidate, onOpen, hidden }: { candidate: CandidateWithJob; onOpen: () => void; hidden: boolean }) {
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

function CandidateCard({ candidate, lifted = false }: { candidate: CandidateWithJob; lifted?: boolean }) {
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

/** pipeline.html empty canvas: shown under the column headers when there is no candidate at all. */
function EmptyPipeline({ onAdd }: { onAdd: () => void }) {
  const tips = [
    {
      icon: Sparkles,
      tone: "bg-primary-fixed text-primary",
      step: "Step 01 · Intake",
      title: "Upload a CV, let AI assess it",
      text: "The PDF text is extracted in your browser, then compared with the job description for a score and a recommendation.",
    },
    {
      icon: GripVertical,
      tone: "bg-secondary-fixed text-secondary",
      step: "Step 02 · Move",
      title: "Drag cards across stages",
      text: "Move candidates from Applied to Hired with the mouse, touch, or the keyboard (Space to pick up, arrows, Space to drop).",
    },
    {
      icon: MousePointerClick,
      tone: "bg-tertiary-fixed text-tertiary",
      step: "Step 03 · Review",
      title: "Open a card for the full profile",
      text: "Edit contact details and notes, replace the CV, and see the AI strengths and gaps in one drawer.",
    },
  ];

  return (
    <div className="relative mt-1 flex flex-col items-center overflow-hidden rounded-2xl bg-surface-container-low/70 px-4 py-10 shadow-[inset_0_2px_8px_rgb(70_60_45/0.04)] sm:px-8 sm:py-14">
      <div className="pointer-events-none absolute inset-0 flex justify-between px-12 opacity-30" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-full w-px bg-surface-variant" />
        ))}
      </div>

      {/* Illustration: one card per stage family, linked by a dashed arc */}
      <div className="relative mb-6 hidden h-40 w-full max-w-2xl sm:block" aria-hidden="true">
        <svg className="absolute inset-0 h-full w-full text-outline-variant/70" fill="none" viewBox="0 0 600 160">
          <path
            d="M 90 90 C 200 20, 260 20, 310 80 C 350 130, 420 130, 510 70"
            stroke="currentColor"
            strokeDasharray="6 6"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <circle cx="90" cy="90" r="5" fill="#3b3fd8" />
          <circle cx="310" cy="80" r="5" fill="#3c6842" />
          <circle cx="510" cy="70" r="5" fill="#5d4f7f" />
        </svg>
        {[
          { stage: "applied" as const, pos: "left-4 top-10 -rotate-3", w: "w-44" },
          { stage: "interview" as const, pos: "left-1/2 top-1 z-10 -translate-x-1/2", w: "w-52" },
          { stage: "offer" as const, pos: "right-4 top-6 rotate-3", w: "w-44" },
        ].map(({ stage, pos, w }) => (
          <div key={stage} className={cn("absolute rounded-lg bg-surface-container-lowest p-3 shadow-clay", pos, w)}>
            <div className="mb-2 flex items-center justify-between">
              <span className="type-label-sm text-on-surface-variant uppercase">{STAGE_LABELS[stage]}</span>
              <Dot className={STAGE_DOT[stage]} />
            </div>
            <div className="mb-2 h-2.5 w-3/4 rounded-full bg-surface-container-high" />
            <div className="h-2 w-1/2 rounded-full bg-surface-container" />
          </div>
        ))}
      </div>

      <div className="relative flex max-w-xl flex-col items-center text-center">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-3 py-1">
          <Dot className="animate-pulse bg-primary" />
          <Eyebrow>Pipeline ready</Eyebrow>
        </span>
        <h2 className="type-headline-md text-on-surface sm:type-headline-lg">Your recruitment pipeline is ready to roll</h2>
        <p className="mt-2 type-body-lg text-on-surface-variant">
          No candidate has entered this pipeline yet. Add your first candidate to start tracking.
        </p>
        <Button size="lg" className="mt-6" onClick={onAdd}>
          <UserPlus /> Add first candidate
        </Button>
      </div>

      <div className="relative mt-10 grid w-full max-w-4xl gap-4 md:grid-cols-3">
        {tips.map(({ icon: Icon, tone, step, title, text }) => (
          <div key={step} className="rounded-lg bg-surface-container-lowest p-5 shadow-clay-sm">
            <div className={cn("mb-3 flex size-9 items-center justify-center rounded-full", tone)}>
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <Eyebrow className="mb-1 block">{step}</Eyebrow>
            <h3 className="mb-1 type-headline-sm text-base text-on-surface">{title}</h3>
            <p className="type-body-sm text-on-surface-variant">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
