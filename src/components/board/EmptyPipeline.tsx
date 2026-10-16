import { GripVertical, MousePointerClick, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dot } from "@/components/ui/badge";
import { STAGE_DOT } from "@/components/shared/badges";
import { Eyebrow } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { STAGE_LABELS } from "@/types";

/** pipeline.html empty canvas: shown under the column headers when there is no candidate at all. */
export function EmptyPipeline({ onAdd }: { onAdd: () => void }) {
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
