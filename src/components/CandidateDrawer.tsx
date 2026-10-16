import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock,
  Eye,
  FileText,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge, Dot } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eyebrow, Field, LinkedInIcon, RecommendationBadge, STAGE_DOT, WithIcon } from "@/components/common";
import { assessCv, deleteCandidate, getCvSignedUrl, uploadCv } from "@/lib/api";
import { useCandidates, useInvalidateData, useJobs, useSetCandidateInCache, useUpdateCandidate } from "@/hooks/queries";
import { cn, emptyToNull, errorMessage, formatDate, normalizeUrl } from "@/lib/utils";
import { STAGES, STAGE_LABELS, type CandidateWithJob, type Stage } from "@/types";

type Props = { candidateId: string | null; onClose: () => void };

export function CandidateDrawer({ candidateId, onClose }: Props) {
  const { data: candidates } = useCandidates();
  const candidate = candidates?.find((c) => c.id === candidateId) ?? null;

  return (
    <Sheet open={!!candidateId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined}>
        {candidate ? (
          <CandidateDetails key={candidate.id} candidate={candidate} onDeleted={onClose} />
        ) : (
          <div className="flex items-center justify-between p-8">
            <SheetTitle className="type-headline-md">{candidates ? "Candidate not found" : "Loading…"}</SheetTitle>
            <DrawerClose />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerClose() {
  return (
    <div className="flex items-center gap-2">
      <kbd className="hidden rounded-md bg-surface-container px-2 py-0.5 type-label-sm text-on-surface-variant shadow-well sm:inline-block">
        ESC
      </kbd>
      <SheetClose className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-surface-container text-on-surface-variant shadow-highlight transition-colors hover:bg-surface-container-highest hover:text-on-surface">
        <X className="size-5" />
        <span className="sr-only">Close</span>
      </SheetClose>
    </div>
  );
}

function Section({ title, icon, action, children }: { title: string; icon?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className={cn("flex items-center gap-1.5 type-label-sm uppercase", icon ? "text-primary" : "text-on-surface-variant")}>
          {icon}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function CandidateDetails({ candidate, onDeleted }: { candidate: CandidateWithJob; onDeleted: () => void }) {
  const { data: jobs = [] } = useJobs();
  const update = useUpdateCandidate();
  const setInCache = useSetCandidateInCache();
  const invalidate = useInvalidateData();
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // A candidate can only move to a job of the same customer.
  const jobOptions = jobs.filter(
    (j) => j.customer_id === candidate.customer_id && (j.status === "open" || j.id === candidate.job_id),
  );

  const [form, setForm] = useState(() => toForm(candidate));
  // Keep the form in sync when the stage changes from the board (drag and drop).
  useEffect(() => {
    setForm((f) => ({ ...f, stage: candidate.stage }));
  }, [candidate.stage]);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(candidate));

  function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) return toast.error("The name is required.");
    update.mutate(
      {
        id: candidate.id,
        patch: {
          full_name: form.full_name.trim(),
          email: emptyToNull(form.email),
          phone: emptyToNull(form.phone),
          linkedin_url: normalizeUrl(form.linkedin_url),
          job_id: form.job_id,
          stage: form.stage,
          notes: emptyToNull(form.notes),
        },
      },
      {
        onSuccess: (c) => {
          setForm(toForm(c));
          toast.success("Candidate saved");
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  const upload = useMutation({
    mutationFn: (file: File) => uploadCv(candidate, file),
    onSuccess: (c) => {
      setInCache(c);
      invalidate();
      if (c.cv_text) toast.success("CV uploaded and text extracted");
      else toast.warning("CV uploaded, but no text could be extracted (scanned PDF?). The AI assessment needs text.");
    },
    onError: (err) => toast.error(`Upload failed: ${errorMessage(err)}`),
  });

  const assess = useMutation({
    mutationFn: () => assessCv(candidate.id),
    onSuccess: (assessment) => {
      setInCache({ ...candidate, ai_score: assessment.score, ai_assessment: assessment });
      invalidate();
      toast.success("AI assessment complete");
    },
    onError: (err) => toast.error(`AI assessment failed: ${errorMessage(err)}`),
  });

  const remove = useMutation({
    mutationFn: () => deleteCandidate(candidate),
    onSuccess: () => {
      invalidate();
      toast.success("Candidate deleted");
      onDeleted();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  async function openCv() {
    if (!candidate.cv_path) return;
    // Open the tab synchronously (popup blockers), then point it to the signed URL.
    const tab = window.open("", "_blank");
    try {
      const url = await getCvSignedUrl(candidate.cv_path);
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      toast.error(errorMessage(err));
    }
  }

  const a = candidate.ai_assessment;
  const pickCv = () => fileInput.current?.click();

  return (
    <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
      {/* ---------- Pinned header ---------- */}
      <header className="relative flex shrink-0 flex-col gap-4 bg-surface-container-low/60 px-6 pt-6 pb-4 backdrop-blur-md sm:px-8 sm:pt-8">
        <div className="flex items-center justify-between gap-3">
          <Select value={form.stage} onValueChange={set("stage")}>
            <SelectPrimitive.Trigger
              aria-label="Stage"
              className="flex cursor-pointer items-center gap-2 rounded-full bg-primary-fixed px-3.5 py-1.5 type-body-sm font-semibold text-on-primary-fixed shadow-[inset_0_1px_1px_rgb(255_255_255/0.8),0_2px_6px_rgb(30_29_194/0.12)] transition-colors hover:bg-primary-container hover:text-on-primary"
            >
              <Dot className={STAGE_DOT[form.stage]} />
              <SelectValue />
              <ChevronDown className="size-4" aria-hidden="true" />
            </SelectPrimitive.Trigger>
            <SelectContent className="w-52">
              <SelectLabel>Move candidate to</SelectLabel>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s} className={s === "rejected" ? "text-error focus:bg-error-container" : undefined}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DrawerClose />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <SheetTitle className="type-headline-md text-on-surface sm:type-headline-lg">{candidate.full_name}</SheetTitle>
            {candidate.jobs?.title && (
              <Badge variant="success" className="px-3 py-1 text-on-secondary-fixed-variant">
                {candidate.jobs.title}
              </Badge>
            )}
          </div>
          <SheetDescription className="flex items-center gap-1.5 type-label-sm text-on-surface-variant uppercase">
            <Clock className="size-3.5" aria-hidden="true" />
            Added {formatDate(candidate.created_at)} · updated {formatDate(candidate.updated_at)}
          </SheetDescription>
        </div>
      </header>

      {/* ---------- Scrollable body ---------- */}
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-5 sm:px-8">
        <Section title="Candidate contact & overview">
          <div className="flex flex-col gap-4 rounded-lg bg-surface-container p-4 shadow-[inset_0_1px_1px_rgb(255_255_255/0.9),0_2px_8px_rgb(70_60_45/0.04)] sm:p-5">
            <Field label="Full name" htmlFor="d-name" required caps>
              <Input
                id="d-name"
                value={form.full_name}
                onChange={(e) => set("full_name")(e.target.value)}
                required
                className="h-10"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Direct email" htmlFor="d-email" caps>
                <WithIcon icon={<Mail />}>
                  <Input
                    id="d-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    className="h-10"
                  />
                </WithIcon>
              </Field>
              <Field label="Phone" htmlFor="d-phone" caps>
                <WithIcon icon={<Phone />}>
                  <Input
                    id="d-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                    className="h-10"
                  />
                </WithIcon>
              </Field>
            </div>
            <Field
              label="LinkedIn profile"
              htmlFor="d-linkedin"
              caps
              aside={
                candidate.linkedin_url ? (
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-0.5 type-body-sm font-semibold text-primary shadow-highlight hover:bg-surface-container-highest"
                  >
                    <LinkedInIcon className="size-3.5" /> Open
                  </a>
                ) : undefined
              }
            >
              <Input
                id="d-linkedin"
                value={form.linkedin_url}
                onChange={(e) => set("linkedin_url")(e.target.value)}
                placeholder="linkedin.com/in/…"
                className="h-10"
              />
            </Field>
            <Field label="Job" caps>
              <Select value={form.job_id} onValueChange={set("job_id")}>
                <SelectTrigger className="h-10" aria-label="Job">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobOptions.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                      {j.status === "closed" ? " (closed)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Recruiter notes" htmlFor="d-notes" caps>
              <Textarea
                id="d-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder="Interview or screening notes…"
                className="resize-none"
              />
            </Field>
          </div>
        </Section>

        <Section title="Curriculum vitae">
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
              e.target.value = "";
            }}
          />
          {candidate.cv_path ? (
            <div className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-clay-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-error-container text-on-error-container shadow-[inset_0_1px_1px_rgb(255_255_255/0.7)]">
                  <FileText className="size-5" aria-hidden="true" />
                  <span className="-mt-0.5 font-label text-[9px] font-bold uppercase">PDF</span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate type-body-md-bold text-on-surface">CV · {candidate.full_name}.pdf</span>
                  <span className="mt-0.5 type-label-sm text-on-surface-variant">
                    {candidate.cv_text
                      ? `${candidate.cv_text.length.toLocaleString()} characters extracted`
                      : "No text could be extracted"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="secondary" size="sm" onClick={openCv}>
                  <Eye className="text-primary" /> Preview
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={pickCv} disabled={upload.isPending}>
                  {upload.isPending ? <Loader2 className="animate-spin" /> : null}
                  {upload.isPending ? "Uploading…" : "Replace"}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={pickCv}
              disabled={upload.isPending}
              className="group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-outline-variant bg-surface-container-low/70 p-5 text-center transition-colors hover:bg-surface-container-high/60 disabled:cursor-wait"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-clay-sm transition-transform group-hover:scale-105">
                {upload.isPending ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
              </span>
              <span className="type-body-md-bold text-on-surface">
                {upload.isPending ? "Uploading and extracting text…" : "Upload the candidate CV (PDF)"}
              </span>
              <span className="type-body-sm text-on-surface-variant">PDF up to 10 MB. The text is extracted for the AI assessment.</span>
            </button>
          )}
          {candidate.cv_text && (
            <details className="rounded-lg bg-surface-container-low type-body-sm shadow-well">
              <summary className="cursor-pointer px-4 py-2.5 type-label-sm text-on-surface-variant uppercase">
                Show extracted text
              </summary>
              <pre className="max-h-64 overflow-auto px-4 pb-4 font-body text-xs whitespace-pre-wrap text-on-surface">
                {candidate.cv_text}
              </pre>
            </details>
          )}
        </Section>

        <Section
          title="AI screening insights"
          icon={<Sparkles className="size-4" aria-hidden="true" />}
          action={
            a && (
              <button
                type="button"
                onClick={() => assess.mutate()}
                disabled={!candidate.cv_text || assess.isPending}
                className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 type-label-sm text-on-surface-variant uppercase transition-colors hover:text-primary disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3.5", assess.isPending && "animate-spin")} aria-hidden="true" />
                {assess.isPending ? "Assessing…" : "Re-assess with AI"}
              </button>
            )
          }
        >
          {a ? (
            <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg bg-surface-container bg-[linear-gradient(165deg,rgb(255_255_255/0.95)_0%,rgb(241_238_230/0.8)_100%)] p-4 shadow-clay sm:p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-white opacity-90" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-highest pb-3">
                <div className="flex items-baseline gap-2">
                  <span className="type-headline-xl text-on-surface">{a.score}</span>
                  <span className="type-body-lg text-on-surface-variant">/ 100</span>
                  <Eyebrow className="ml-1">AI score</Eyebrow>
                </div>
                <RecommendationBadge value={a.recommendation} />
              </div>
              <p className="type-body-md leading-relaxed text-on-surface-variant">{a.summary}</p>
              <div className="grid gap-3">
                <InsightList
                  title="Key strengths"
                  items={a.strengths ?? []}
                  icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                  tone="text-secondary"
                  bullet="bg-secondary"
                />
                <InsightList
                  title="Gaps to probe in interview"
                  items={a.gaps ?? []}
                  icon={<CircleHelp className="size-4" aria-hidden="true" />}
                  tone="text-on-surface-variant"
                  bullet="bg-outline"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-container p-5 shadow-highlight">
              <p className="type-body-sm text-on-surface-variant">
                {candidate.cv_text
                  ? "Compare this CV with the job description to get a score, strengths, gaps and a recommendation."
                  : "Upload a PDF CV first: the AI reads the extracted text."}
              </p>
              <Button type="button" onClick={() => assess.mutate()} disabled={!candidate.cv_text || assess.isPending}>
                {assess.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {assess.isPending ? "Assessing…" : "Assess with AI"}
              </Button>
            </div>
          )}
          <p className="type-body-sm text-on-surface-variant">
            AI output is a screening aid, not a decision. Personal attributes are ignored by the prompt.
          </p>
        </Section>
      </div>

      {/* ---------- Pinned footer ---------- */}
      <footer className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 bg-surface-container-low/95 px-6 py-4 shadow-[0_-4px_16px_rgb(70_60_45/0.06),inset_0_1px_1px_rgb(255_255_255/0.85)] backdrop-blur-md sm:px-8">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-body-sm text-on-surface">Delete permanently, with the CV?</span>
            <Button
              type="button"
              variant="destructive-solid"
              size="sm"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              {remove.isPending && <Loader2 className="animate-spin" />}
              Yes, delete
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
          </div>
        ) : (
          <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Delete candidate
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <span className="hidden items-center gap-1.5 type-label-sm text-on-surface-variant uppercase sm:flex">
              <Dot className="bg-primary-container" /> Unsaved
            </span>
          )}
          <SheetClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" disabled={update.isPending || !dirty}>
            {update.isPending ? <Loader2 className="animate-spin" /> : <Check />}
            Save changes
          </Button>
        </div>
      </footer>
    </form>
  );
}

function InsightList({
  title,
  items,
  icon,
  tone,
  bullet,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
  tone: string;
  bullet: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3.5 shadow-[inset_0_1px_2px_rgb(255_255_255/0.8),0_1px_3px_rgb(70_60_45/0.03)]">
      <div className={cn("flex items-center gap-1.5 type-label-sm uppercase", tone)}>
        {icon}
        {title}
      </div>
      {items.length === 0 ? (
        <p className="type-body-sm text-on-surface-variant">None listed.</p>
      ) : (
        <ul className="flex flex-col gap-1.5 pl-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 type-body-sm text-on-surface">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", bullet)} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function toForm(c: CandidateWithJob) {
  return {
    full_name: c.full_name,
    email: c.email ?? "",
    phone: c.phone ?? "",
    linkedin_url: c.linkedin_url ?? "",
    job_id: c.job_id,
    stage: c.stage as Stage,
    notes: c.notes ?? "",
  };
}
