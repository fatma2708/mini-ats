import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Briefcase, Info, Loader2, Mail, Phone, Plus, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { Field, WithIcon } from "@/components/shared/form";
import { createCandidate } from "@/lib/api";
import { useInvalidateData, useJobs } from "@/hooks/queries";
import { useJobLabel } from "@/hooks/useJobLabel";
import { emptyToNull, errorMessage, normalizeUrl } from "@/lib/utils";
import { STAGES, STAGE_LABELS, type CandidateWithJob, type Stage } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultJobId?: string;
  onCreated?: (candidate: CandidateWithJob) => void;
};

export function AddCandidateDialog({ open, onOpenChange, defaultJobId, onCreated }: Props) {
  const invalidate = useInvalidateData();
  const { data: jobs = [] } = useJobs();
  const jobLabel = useJobLabel();
  const openJobs = jobs.filter((j) => j.status === "open");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [jobId, setJobId] = useState("");
  const [stage, setStage] = useState<Stage>("applied");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setEmail("");
    setPhone("");
    setLinkedin("");
    setNotes("");
    setStage("applied");
    setJobId(defaultJobId && openJobs.some((j) => j.id === defaultJobId) ? defaultJobId : "");
    // Reset only when the dialog opens.
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) throw new Error("Please select a job.");
      return createCandidate({
        job_id: job.id,
        customer_id: job.customer_id,
        full_name: fullName.trim(),
        email: emptyToNull(email),
        phone: emptyToNull(phone),
        linkedin_url: normalizeUrl(linkedin),
        notes: emptyToNull(notes),
        stage,
      });
    },
    onSuccess: (candidate) => {
      invalidate();
      toast.success(`${candidate.full_name} added`);
      onOpenChange(false);
      onCreated?.(candidate);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("The name is required.");
    if (!jobId) return toast.error("Please select a job.");
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent accent>
        <DialogHeader>
          <DialogTitle>Add new candidate</DialogTitle>
          <DialogDescription>
            Enter the applicant details. You can upload the CV and run the AI assessment from their profile.
          </DialogDescription>
        </DialogHeader>

        {openJobs.length === 0 ? (
          <DialogBody className="pb-8">
            <EmptyState
              compact
              icon={<Briefcase />}
              title="No open job yet"
              description="A candidate must be attached to a job."
              className="shadow-none"
              action={
                <Button asChild>
                  <Link to="/jobs?new=1" onClick={() => onOpenChange(false)}>
                    <Plus /> Create a job
                  </Link>
                </Button>
              }
            />
          </DialogBody>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="grid gap-5">
              <Field label="Full name" htmlFor="c-name" required hint="Primary identifier">
                <WithIcon icon={<User />}>
                  <Input
                    id="c-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    autoFocus
                    required
                  />
                </WithIcon>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email address" htmlFor="c-email">
                  <WithIcon icon={<Mail />}>
                    <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </WithIcon>
                </Field>
                <Field label="Phone number" htmlFor="c-phone" hint="Direct">
                  <WithIcon icon={<Phone />}>
                    <Input id="c-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </WithIcon>
                </Field>
              </div>
              <Field label="LinkedIn profile" htmlFor="c-linkedin" hint="Network URL">
                <WithIcon
                  icon={
                    <span className="rounded-[4px] bg-primary-fixed px-1 py-0.5 type-label-sm leading-none font-bold text-primary normal-case">
                      in
                    </span>
                  }
                >
                  <Input
                    id="c-linkedin"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/…"
                  />
                </WithIcon>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Job"
                  required
                  aside={<span className="type-label-sm text-primary uppercase">Required</span>}
                >
                  <Select value={jobId} onValueChange={setJobId}>
                    <SelectTrigger aria-label="Job">
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                    <SelectContent>
                      {openJobs.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {jobLabel(j)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Initial stage" hint="Pipeline">
                  <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
                    <SelectTrigger aria-label="Initial stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STAGE_LABELS[s]}
                          {s === "applied" ? " (default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Notes" htmlFor="c-notes">
                <Textarea
                  id="c-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Source, first impressions…"
                />
              </Field>
            </DialogBody>
            <DialogFooter className="sm:justify-between">
              <p className="flex items-center gap-2 type-body-sm text-on-surface-variant">
                <Info className="size-4 shrink-0 text-outline" aria-hidden="true" />
                Upload the CV from the candidate profile after creation.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
                  Add candidate
                  {!mutation.isPending && <ArrowRight />}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
