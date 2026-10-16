import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/brand";
import { Field, WithIcon } from "@/components/shared/form";
import { errorMessage } from "@/lib/utils";

export function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/board";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface-container-low">
      <div className="pointer-events-none absolute -top-24 right-1/4 size-96 rounded-full bg-primary-fixed-dim/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-4 size-72 rounded-full bg-secondary-container/30 blur-2xl" />

      <header className="relative flex h-20 items-center justify-between px-5 sm:px-10">
        <Link to="/" className="rounded-lg">
          <Logo />
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft /> Back to home
          </Link>
        </Button>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_-8px_rgb(70_60_45/0.08),0_4px_12px_rgb(70_60_45/0.04)] [background-image:linear-gradient(165deg,rgb(255_255_255/0.95)_0%,rgb(246_243_235/0.4)_100%)] sm:p-10">
          <div className="mb-8 flex flex-col items-start gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 type-label-sm text-primary uppercase shadow-[inset_0_1px_1px_rgb(255_255_255/0.9)]">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              Welcome back
            </span>
            <h1 className="type-headline-lg text-on-surface">Sign in</h1>
            <p className="type-body-md text-on-surface-variant">Manage your jobs and hiring pipeline.</p>
          </div>

          <form onSubmit={onSubmit} className="grid gap-5">
            <Field label="Email" htmlFor="email">
              <WithIcon icon={<Mail />}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </WithIcon>
            </Field>
            <Field label="Password" htmlFor="password">
              <WithIcon icon={<Lock />}>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </WithIcon>
            </Field>
            <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
              {submitting ? <Loader2 className="animate-spin" /> : null}
              Sign in
              {!submitting && <ArrowRight />}
            </Button>
          </form>

          <p className="mt-6 flex items-center gap-2 type-body-sm text-on-surface-variant">
            <ShieldCheck className="size-4 shrink-0 text-secondary" aria-hidden="true" />
            No account? Accounts are created by your administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
