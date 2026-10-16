import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Briefcase, Plus, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCandidates, useJobs, useMoveCandidate } from "@/hooks/queries";
import { useJobLabel } from "@/hooks/useJobLabel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StageColumn } from "@/components/board/StageColumn";
import { CandidateCard, DraggableCard } from "@/components/board/CandidateCard";
import { EmptyPipeline } from "@/components/board/EmptyPipeline";
import { AddCandidateDialog } from "@/components/candidates/AddCandidateDialog";
import { CandidateDrawer } from "@/components/candidates/CandidateDrawer";
import { STAGES, type CandidateWithJob, type Stage } from "@/types";

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
                <StageColumn
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
                </StageColumn>
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
