import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Columns3,
  FileText,
  Filter,
  GripVertical,
  Loader2,
  LockKeyhole,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dot } from "@/components/ui/badge";
import { Logo } from "@/components/shared/brand";
import { STAGE_DOT } from "@/components/shared/badges";
import { Eyebrow } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { STAGES, STAGE_LABELS } from "@/types";

/** Public landing page (design/landing.html). Logged-in users go straight to the board. */
export function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container-low">
        <Loader2 className="size-6 animate-spin text-on-surface-variant" aria-label="Loading" />
      </div>
    );
  }
  if (user) return <Navigate to="/board" replace />;

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface">
      <header className="fixed top-0 z-50 w-full bg-surface-container-low/90 shadow-bar backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-10">
          <Logo />
          <nav
            aria-label="Sections"
            className="hidden items-center gap-1 rounded-full bg-surface-container p-1 shadow-well md:flex"
          >
            <a href="#features" className="rounded-full px-5 py-1.5 type-body-md-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface">
              Features
            </a>
            <a href="#how-it-works" className="rounded-full px-5 py-1.5 type-body-md-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface">
              How it works
            </a>
          </nav>
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="pt-20">
        {/* ---------- Hero ---------- */}
        <section className="relative mx-auto max-w-7xl overflow-hidden px-5 pt-6 pb-12 sm:px-10">
          <div className="pointer-events-none absolute -top-24 right-1/4 size-96 rounded-full bg-primary-fixed-dim/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-4 size-72 rounded-full bg-secondary-container/30 blur-2xl" />
          <div className="relative rounded-3xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_-8px_rgb(70_60_45/0.08),0_4px_12px_rgb(70_60_45/0.04)] [background-image:linear-gradient(165deg,rgb(255_255_255/0.95)_0%,rgb(246_243_235/0.4)_100%)] sm:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="flex flex-col items-start gap-5 lg:col-span-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 type-label-sm text-primary uppercase shadow-[inset_0_1px_1px_rgb(255_255_255/0.9)]">
                  <Dot className="bg-primary" />
                  Applicant tracking, simplified
                </span>
                <h1 className="type-headline-xl-mobile text-on-surface sm:type-headline-xl">
                  Hire with clarity,
                  <br className="hidden sm:inline" /> <span className="text-primary">not spreadsheets.</span>
                </h1>
                <p className="max-w-xl type-body-lg text-on-surface-variant">
                  A calm recruitment workspace: publish your jobs, move candidates through a Kanban pipeline, and get an
                  AI assessment of each CV against the job description.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button asChild size="lg">
                    <Link to="/login">
                      Get started <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <a href="#how-it-works">See how it works</a>
                  </Button>
                </div>
                <p className="flex items-center gap-2 pt-1 type-label-sm text-on-surface-variant uppercase">
                  <LockKeyhole className="size-4 text-secondary" aria-hidden="true" />
                  Accounts are created by your administrator
                </p>
              </div>

              <HeroIllustration />
            </div>
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12 sm:px-10">
          <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <Eyebrow className="text-primary">Designed for flow</Eyebrow>
              <h2 className="mt-1 type-headline-md text-on-surface sm:type-headline-lg">Software that gets out of your way</h2>
            </div>
            <p className="max-w-md type-body-md text-on-surface-variant">
              Everything a small hiring team needs, nothing it has to configure.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <FeatureCard
              icon={<Columns3 />}
              tone="bg-primary-fixed text-primary"
              title="Kanban pipeline"
              text="Six stages from Applied to Hired. Drag and drop with the mouse, touch or keyboard; changes save instantly."
            >
              <div className="grid grid-cols-3 gap-1.5">
                {(["applied", "screening", "offer"] as const).map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "flex items-center gap-1.5 rounded-sm p-2 shadow-sm",
                      s === "screening" ? "bg-primary-fixed text-primary" : "bg-surface-container-lowest text-on-surface-variant",
                    )}
                  >
                    <Dot className={cn("size-1.5", STAGE_DOT[s])} />
                    <span className="truncate type-label-sm">{STAGE_LABELS[s]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-md bg-surface-container-lowest p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="size-6 rounded-full bg-secondary-fixed" aria-hidden="true" />
                  <span className="h-2.5 w-24 rounded-full bg-surface-container-high" aria-hidden="true" />
                </div>
                <GripVertical className="size-[18px] text-primary" aria-hidden="true" />
              </div>
            </FeatureCard>
            <FeatureCard
              icon={<Filter />}
              tone="bg-secondary-container text-on-secondary-container"
              title="Filters you can share"
              text="Filter the board by job and search by name. Filters live in the URL, so a view can be bookmarked."
            >
              <div className="flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-1 type-label-sm text-on-primary-fixed">
                  <Briefcase className="size-3.5" aria-hidden="true" /> Job
                </span>
                <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 type-label-sm text-on-surface shadow-sm">
                  Name search
                </span>
                <span className="rounded-full bg-secondary-fixed px-2.5 py-1 type-label-sm text-on-secondary-fixed">
                  ?job=…&amp;q=…
                </span>
              </div>
            </FeatureCard>
            <FeatureCard
              icon={<Sparkles />}
              tone="bg-tertiary-fixed text-tertiary"
              title="AI CV assessment"
              text="Upload a PDF CV: its text is extracted in the browser, then compared with the job for a score, strengths, gaps and a recommendation."
            >
              {["Score / 100", "Strengths & gaps", "Advance · Maybe · Reject"].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between rounded-sm bg-surface-container-lowest px-2.5 py-1.5 type-body-sm text-on-surface shadow-sm"
                >
                  {row}
                  <Dot className="bg-secondary" />
                </div>
              ))}
            </FeatureCard>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how-it-works" className="scroll-mt-20 bg-surface-container py-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-10">
            <div className="mb-8 max-w-3xl">
              <Eyebrow className="text-primary">Workflow</Eyebrow>
              <h2 className="mt-1 type-headline-md text-on-surface sm:type-headline-lg">From vacancy to hire in 3 steps</h2>
              <p className="mt-2 type-body-md text-on-surface-variant">
                Each customer only ever sees their own jobs and candidates: isolation is enforced by the database.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { n: "01", title: "Create a job", text: "Title, location and a precise description: it is what the AI compares CVs with.", icon: Briefcase },
                { n: "02", title: "Add candidates", text: "Add contact details and LinkedIn, upload the PDF CV and run the AI assessment.", icon: UserPlus },
                { n: "03", title: "Move them forward", text: "Drag cards from Applied to Hired and keep notes on every candidate.", icon: FileText },
              ].map(({ n, title, text, icon: Icon }) => (
                <div key={n} className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-6 shadow-[0_4px_16px_rgb(70_60_45/0.06)]">
                  <div>
                    <span className="type-label-md text-primary uppercase">
                      {n} · {title}
                    </span>
                    <p className="mt-3 type-body-sm text-on-surface-variant">{text}</p>
                  </div>
                  <div className="mt-6 flex justify-end border-t border-surface-container pt-3 text-on-surface-variant">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-10">
          <div className="flex flex-col items-center rounded-3xl bg-inverse-surface p-8 text-center text-inverse-on-surface shadow-[0_24px_48px_-8px_rgb(30_30_30/0.3)] sm:p-14">
            <span className="mb-3 rounded-full bg-surface-container/15 px-3 py-1 type-label-sm text-surface-bright uppercase">
              Mini ATS
            </span>
            <h2 className="max-w-2xl type-headline-md text-surface-container-lowest sm:type-headline-lg">
              Start tracking candidates with clarity today
            </h2>
            <p className="mt-2 mb-8 max-w-lg type-body-md text-surface-dim">
              Sign in with the account your administrator created for you.
            </p>
            <Button asChild size="lg" className="focus-visible:outline-white">
              <Link to="/login">
                Sign in <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container py-8 shadow-[inset_0_1px_2px_rgb(255_255_255/0.8)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:px-10 md:flex-row">
          <Logo className="opacity-80" />
          <nav aria-label="Footer" className="flex items-center gap-6 type-body-sm text-on-surface-variant">
            <a href="#features" className="hover:text-on-surface">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-on-surface">
              How it works
            </a>
            <Link to="/login" className="hover:text-on-surface">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  tone,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-6 shadow-clay">
      <div>
        <div className={cn("mb-3 flex size-10 items-center justify-center rounded-full [&_svg]:size-5", tone)} aria-hidden="true">
          {icon}
        </div>
        <h3 className="type-headline-sm text-on-surface">{title}</h3>
        <p className="mt-1 type-body-sm text-on-surface-variant">{text}</p>
      </div>
      <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-surface-container-low p-3" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** Decorative product sketch: a dark "job" card with the six stages around it (no real or fake data). */
function HeroIllustration() {
  return (
    <div className="relative hidden h-[420px] w-full items-center justify-center sm:flex lg:col-span-6" aria-hidden="true">
      <svg className="pointer-events-none absolute inset-0 h-full w-full text-outline-variant" fill="none">
        <line x1="50%" y1="50%" x2="20%" y2="18%" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" />
        <line x1="50%" y1="50%" x2="80%" y2="18%" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" />
        <line x1="50%" y1="50%" x2="20%" y2="84%" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" />
        <line x1="50%" y1="50%" x2="80%" y2="84%" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" />
      </svg>

      <div className="z-20 flex w-72 flex-col gap-2 rounded-2xl bg-inverse-surface p-5 text-inverse-on-surface shadow-[0_16px_36px_rgb(30_30_30/0.28)] transition-transform duration-300 hover:scale-105">
        <div className="flex items-center justify-between">
          <span className="type-label-sm text-surface-dim uppercase">Open job</span>
          <Dot className="size-2.5 bg-secondary-container" />
        </div>
        <div className="flex items-center gap-2 type-headline-sm text-surface-container-lowest">
          <Building2 className="size-5 text-inverse-primary" /> Your next hire
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {STAGES.map((s) => (
            <span key={s} className="flex items-center gap-1 rounded-full bg-surface-container/15 px-2 py-0.5 type-label-sm text-surface-bright">
              <Dot className={cn("size-1.5", STAGE_DOT[s])} />
              {STAGE_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute top-4 left-2 z-10 flex w-48 flex-col gap-2 rounded-2xl bg-surface-container-lowest p-3 shadow-[0_10px_20px_-3px_rgb(70_60_45/0.1)]">
        <div className="flex items-center justify-between">
          <span className="type-label-sm text-on-surface-variant uppercase">AI score</span>
          <span className="rounded-sm bg-secondary-fixed px-1.5 py-0.5 type-label-sm text-on-secondary-fixed">/ 100</span>
        </div>
        <div className="h-2.5 w-3/4 rounded-full bg-surface-container-high" />
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div className="h-full w-4/5 rounded-full bg-secondary" />
        </div>
      </div>

      <div className="absolute top-2 right-2 z-10 flex w-52 flex-col gap-1.5 rounded-2xl bg-surface-container-lowest p-3 shadow-[0_10px_20px_-3px_rgb(70_60_45/0.1)]">
        <div className="flex items-center justify-between">
          <span className="type-label-sm text-on-surface-variant uppercase">Recommendation</span>
          <span className="rounded-sm bg-tertiary-fixed px-1.5 py-0.5 type-label-sm text-on-tertiary-fixed">AI</span>
        </div>
        <div className="flex gap-1">
          <span className="rounded-full bg-secondary-container px-2 py-0.5 type-label-sm text-on-secondary-fixed">Advance</span>
          <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 type-label-sm text-on-tertiary-fixed">Maybe</span>
          <span className="rounded-full bg-error-container px-2 py-0.5 type-label-sm text-on-error-container">Reject</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-2 z-10 flex w-44 items-center gap-2 rounded-2xl bg-surface-container-lowest p-3 shadow-[0_10px_20px_-3px_rgb(70_60_45/0.1)]">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <FileText className="size-[18px]" />
        </span>
        <div>
          <div className="type-body-md-bold text-on-surface">PDF CV</div>
          <div className="type-label-sm text-on-surface-variant uppercase">Text extracted</div>
        </div>
      </div>

      <div className="absolute right-2 bottom-6 z-10 flex w-48 items-center gap-2 rounded-2xl bg-surface-container-lowest p-3 shadow-[0_10px_20px_-3px_rgb(70_60_45/0.1)]">
        <span className="flex size-8 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
          <GripVertical className="size-[18px]" />
        </span>
        <div>
          <div className="type-body-md-bold text-on-surface">Drag &amp; drop</div>
          <div className="type-label-sm text-on-surface-variant uppercase">Keyboard too</div>
        </div>
      </div>
    </div>
  );
}
