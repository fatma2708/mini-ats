import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogEyebrow,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dot } from "@/components/ui/badge";
import { Field } from "@/components/shared/form";
import { createJob, updateJob } from "@/lib/api";
import { useInvalidateData } from "@/hooks/queries";
import { cn, emptyToNull, errorMessage } from "@/lib/utils";
import type { Job, JobStatus } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Job to edit; omit to create a new one. */
  job?: Job | null;
  /** Owner of a new job (required when creating). */
  customerId: string | null;
};

const STATUS_OPTIONS: { value: JobStatus; label: string; dot: string }[] = [
  { value: "open", label: "Open", dot: "bg-secondary" },
  { value: "closed", label: "Closed", dot: "bg-outline-variant" },
];

export function JobFormDialog({ open, onOpenChange, job, customerId }: Props) {
  const invalidate = useInvalidateData();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<JobStatus>("open");

  useEffect(() => {
    if (!open) return;
    setTitle(job?.title ?? "");
    setDescription(job?.description ?? "");
    setLocation(job?.location ?? "");
    setStatus(job?.status ?? "open");
  }, [open, job]);

  const mutation = useMutation({
    mutationFn: async () => {
      const values = {
        title: title.trim(),
        description: emptyToNull(description),
        location: emptyToNull(location),
        status,
      };
      if (job) return updateJob(job.id, values);
      if (!customerId) throw new Error("Select a customer first.");
      return createJob({ ...values, customer_id: customerId });
    },
    onSuccess: () => {
      invalidate();
      toast.success(job ? "Job updated" : "Job created");
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("The title is required.");
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="bg-surface-container-low pb-5 shadow-[inset_0_1px_1px_rgb(255_255_255/0.85)]">
          <DialogEyebrow>{job ? "Edit job" : "New job"}</DialogEyebrow>
          <DialogTitle>{job ? job.title : "Create new job opening"}</DialogTitle>
          <DialogDescription>
            The description is used by the AI to assess candidates, so be specific about required skills.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid gap-5 py-6">
            <Field label="Job title" htmlFor="job-title" required>
              <Input
                id="job-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                autoFocus
                required
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Location & policy" htmlFor="job-location">
                <div className="relative">
                  <Input
                    id="job-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Paris (Hybrid)"
                    className="pr-11"
                  />
                  <MapPin
                    className="pointer-events-none absolute top-1/2 right-3.5 size-[18px] -translate-y-1/2 text-outline"
                    aria-hidden="true"
                  />
                </div>
              </Field>
              <fieldset className="grid gap-1.5">
                <legend className="mb-1.5 type-body-md-bold text-on-surface">Status</legend>
                <div className="flex gap-1.5 rounded-lg bg-surface-container-low p-1 shadow-well">
                  {STATUS_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className={cn(
                        "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md py-2 type-body-md transition-all select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-container",
                        status === o.value
                          ? "bg-surface-container-lowest type-body-md-bold text-primary shadow-clay-sm"
                          : "text-on-surface-variant hover:text-on-surface",
                      )}
                    >
                      <input
                        type="radio"
                        name="job-status"
                        value={o.value}
                        checked={status === o.value}
                        onChange={() => setStatus(o.value)}
                        className="sr-only"
                      />
                      <Dot className={o.dot} />
                      {o.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <Field label="Job description & role summary" htmlFor="job-description">
              <Textarea
                id="job-description"
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Responsibilities, required skills, nice to have…"
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
              {job ? "Save changes" : "Create job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
