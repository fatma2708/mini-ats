import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Archive, ArrowRight, Briefcase, CheckCircle2, Info, MapPin, Pencil, Plus, RotateCcw, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCandidates, useInvalidateData, useJobs, useProfiles } from "@/hooks/queries";
import { updateJob } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge, Dot } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, Eyebrow, PageHeader } from "@/components/common";
import { JobFormDialog } from "@/components/JobFormDialog";
import { cn, errorMessage, formatDate } from "@/lib/utils";
import { STAGES, type Job, type JobStatus, type Stage } from "@/types";

type StatusFilter = JobStatus | "all";
type StageCounts = Record<Stage, number> & { total: number };

/** Segment colors of the per-job pipeline bar (create_new_role.html). */
const BAR_SEGMENTS: { stages: Stage[]; label: string; className: string }[] = [
  { stages: ["applied"], label: "Applied", className: "bg-primary/30" },
  { stages: ["screening"], label: "Screen", className: "bg-primary/50" },
  { stages: ["interview"], label: "Interv.", className: "bg-primary/80" },
  { stages: ["offer", "hired"], label: "Offer+", className: "bg-secondary" },
];

export function JobsPage() {
  const { isAdmin, customerId } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: jobs, isPending, isError, error } = useJobs();
  const { data: candidates = [] } = useCandidates();
  const { data: profiles = [] } = useProfiles(isAdmin && !customerId);
  const invalidate = useInvalidateData();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [editing, setEditing] = useState<Job | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Admins must pick a customer before creating jobs (a job always belongs to one customer).
  const canCreate = !!customerId;

  // /jobs?new=1 opens the creation form (used by empty states elsewhere).
  useEffect(() => {
    if (params.get("new") === "1") {
      if (canCreate) {
        setEditing(null);
        setFormOpen(true);
      }
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("new");
          return next;
        },
        { replace: true },
      );
    }
  }, [params, setParams, canCreate]);

  const counts = useMemo(() => {
    const m = new Map<string, StageCounts>();
    for (const c of candidates) {
      const row = m.get(c.job_id) ?? ({ ...Object.fromEntries(STAGES.map((s) => [s, 0])), total: 0 } as StageCounts);
      row[c.stage] += 1;
      row.total += 1;
      m.set(c.job_id, row);
    }
    return m;
  }, [candidates]);

  const toggle = useMutation({
    mutationFn: (job: Job) => updateJob(job.id, { status: job.status === "open" ? "closed" : "open" }),
    onSuccess: (job) => {
      invalidate();
      toast.success(job.status === "closed" ? `"${job.title}" closed` : `"${job.title}" reopened`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const allJobs = jobs ?? [];
  const visible = allJobs.filter((j) => statusFilter === "all" || j.status === statusFilter);
  const openCount = allJobs.filter((j) => j.status === "open").length;
  const companyOf = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    return p ? p.company_name || p.email : null;
  };

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  const newJobButton = (
    <Button
      onClick={openCreate}
      disabled={!canCreate}
      title={canCreate ? undefined : "Select a customer in “Viewing as” to create a job"}
    >
      <Plus /> New job
    </Button>
  );

  const metrics = [
    { label: "Open jobs", value: openCount, unit: "positions", icon: Briefcase, tone: "bg-secondary-container text-on-secondary-container" },
    { label: "Total candidates", value: candidates.length, unit: "in pipeline", icon: Users, tone: "bg-primary-fixed text-primary" },
    {
      label: "Hired",
      value: candidates.filter((c) => c.stage === "hired").length,
      unit: "candidates",
      icon: CheckCircle2,
      tone: "bg-tertiary-fixed text-tertiary",
    },
    {
      label: "Closed jobs",
      value: allJobs.length - openCount,
      unit: "archived",
      icon: Archive,
      tone: "bg-surface-container-high text-on-surface-variant",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={
          <>
            <Eyebrow className="text-primary">Requisitions</Eyebrow>
            <Dot className="size-1.5 bg-outline-variant" />
            <Eyebrow>{jobs ? `${openCount} active` : "…"}</Eyebrow>
          </>
        }
        title="Open positions"
        description="Create, edit and close the roles your candidates apply to."
        actions={newJobButton}
      />

      {isAdmin && !customerId && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-surface-container-low p-4 type-body-sm text-on-surface-variant shadow-highlight">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            You are viewing the jobs of <strong className="text-on-surface">all customers</strong>. Pick a customer in
            “Viewing as” to create a job on their behalf.
          </p>
        </div>
      )}

      {isPending ? (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <EmptyState compact title="Could not load jobs" description={error?.message} />
      ) : allJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          eyebrow="Current roster · 0 listings"
          title="No open positions yet"
          description="Create your first job listing to start adding candidates, upload their CVs and evaluate them with AI."
          action={
            canCreate ? (
              <Button size="lg" onClick={openCreate}>
                <Plus /> Create your first job
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ label, value, unit, icon: Icon, tone }) => (
              <div key={label} className="flex flex-col rounded-lg bg-surface-container-lowest p-5 shadow-clay-sm">
                <div className="flex items-center justify-between pb-1">
                  <Eyebrow>{label}</Eyebrow>
                  <span className={cn("flex size-8 items-center justify-center rounded-full", tone)}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="type-headline-xl text-on-surface tabular-nums">{value}</span>
                  <span className="type-label-md text-on-surface-variant">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            role="radiogroup"
            aria-label="Filter jobs by status"
            className="flex w-fit gap-1 rounded-full bg-surface-container p-1 shadow-[inset_0_1px_1px_rgb(255_255_255/0.85)]"
          >
            {(["open", "closed", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-1.5 type-body-md capitalize transition-all",
                  statusFilter === s
                    ? "bg-surface-container-lowest type-body-md-bold text-primary shadow-clay-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {s}
                <span className="ml-1.5 type-label-sm opacity-80">
                  {s === "all" ? allJobs.length : allJobs.filter((j) => j.status === s).length}
                </span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              compact
              icon={<Briefcase />}
              title={`No ${statusFilter} jobs`}
              description="Change the filter above to see other jobs."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  counts={counts.get(job.id)}
                  company={isAdmin && !customerId ? companyOf(job.customer_id) : null}
                  toggling={toggle.isPending && toggle.variables?.id === job.id}
                  onEdit={() => {
                    setEditing(job);
                    setFormOpen(true);
                  }}
                  onToggle={() => toggle.mutate(job)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <JobFormDialog open={formOpen} onOpenChange={setFormOpen} job={editing} customerId={customerId} />
    </div>
  );
}

function JobCard({
  job,
  counts,
  company,
  toggling,
  onEdit,
  onToggle,
}: {
  job: Job;
  counts?: StageCounts;
  company: string | null;
  toggling: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const closed = job.status === "closed";
  const total = counts?.total ?? 0;
  const inPlay = total - (counts?.rejected ?? 0);

  return (
    <article
      className={cn(
        "group flex flex-col justify-between rounded-2xl p-5 transition-all",
        closed
          ? "bg-surface-container-low shadow-sm"
          : "bg-surface-container-lowest shadow-clay hover:shadow-[0_16px_32px_-4px_rgb(70_60_45/0.12)]",
      )}
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge variant={closed ? "neutral" : "success"} className="normal-case">
            <Dot className={closed ? "size-1.5 bg-outline" : "size-1.5 bg-secondary"} />
            {closed ? "Closed" : "Open"}
          </Badge>
          {company && (
            <span className="truncate type-label-sm text-on-surface-variant uppercase" title={company}>
              {company}
            </span>
          )}
        </div>
        <h2 className={cn("type-headline-sm text-on-surface transition-colors", !closed && "group-hover:text-primary")}>
          {job.title}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 type-body-sm text-on-surface-variant">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" /> {job.location}
            </span>
          )}
          <span>Created {formatDate(job.created_at)}</span>
        </div>
        {job.description && (
          <p className="mt-2 line-clamp-2 type-body-sm whitespace-pre-line text-on-surface-variant">{job.description}</p>
        )}

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="type-body-md-bold text-on-surface">
              {total} candidate{total === 1 ? "" : "s"}
            </span>
            {counts?.hired ? (
              <span className="flex items-center gap-1 type-label-sm text-secondary uppercase">
                <CheckCircle2 className="size-3.5" aria-hidden="true" /> {counts.hired} hired
              </span>
            ) : counts?.rejected ? (
              <span className="flex items-center gap-1 type-label-sm text-on-surface-variant uppercase">
                <XCircle className="size-3.5" aria-hidden="true" /> {counts.rejected} rejected
              </span>
            ) : null}
          </div>
          {/* Segmented pipeline bar (rejected candidates are left out) */}
          <div
            className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface-container p-0.5 shadow-inner"
            role="img"
            aria-label={BAR_SEGMENTS.map(
              (s) => `${s.stages.reduce((n, st) => n + (counts?.[st] ?? 0), 0)} ${s.label}`,
            ).join(", ")}
          >
            {inPlay > 0 &&
              BAR_SEGMENTS.map((s) => {
                const n = s.stages.reduce((acc, st) => acc + (counts?.[st] ?? 0), 0);
                return n > 0 ? (
                  <div
                    key={s.label}
                    className={cn("h-full first:rounded-l-full last:rounded-r-full", s.className)}
                    style={{ width: `${(n / inPlay) * 100}%` }}
                  />
                ) : null;
              })}
          </div>
          <div className="mt-1.5 flex justify-between font-label text-[11px] tracking-tight text-on-surface-variant">
            {BAR_SEGMENTS.map((s) => (
              <span key={s.label} className={s.label === "Offer+" ? "font-bold text-secondary" : undefined}>
                {s.stages.reduce((n, st) => n + (counts?.[st] ?? 0), 0)} {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 flex items-center justify-between gap-2 rounded-lg p-2",
          closed ? "bg-surface-container" : "bg-surface-container-low",
        )}
      >
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${job.title}`}>
            <Pencil /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} disabled={toggling}>
            {closed ? (
              <>
                <RotateCcw /> Reopen
              </>
            ) : (
              <>
                <Archive /> Close
              </>
            )}
          </Button>
        </div>
        <Link
          to={`/board?job=${job.id}`}
          className="inline-flex items-center gap-1 rounded-full px-2 type-body-md-bold text-primary hover:underline"
        >
          Pipeline <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
