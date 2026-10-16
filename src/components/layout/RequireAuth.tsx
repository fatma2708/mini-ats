import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <Loader2 className="size-6 animate-spin text-on-surface-variant" aria-label="Loading" />
    </div>
  );
}

export function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
        <p className="type-headline-sm text-on-surface">Your account has no profile yet.</p>
        <p className="max-w-sm type-body-md text-on-surface-variant">
          Ask an administrator to check your account in Supabase (table <code>profiles</code>).
        </p>
        <Button variant="secondary" onClick={signOut}>
          Log out
        </Button>
      </div>
    );
  }

  if (adminOnly && !isAdmin) return <Navigate to="/board" replace />;
  return <>{children}</>;
}
