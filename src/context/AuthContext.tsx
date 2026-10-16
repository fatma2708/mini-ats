import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getProfile, queryKeys } from "@/lib/api";
import type { Profile } from "@/types";

/** Minimal info about the customer an admin is acting for. */
export type ViewingAs = Pick<Profile, "id" | "email" | "company_name" | "full_name">;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True until the session (and the profile, when logged in) is known. */
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Admin only: customer currently impersonated, null = all customers. */
  viewingAs: ViewingAs | null;
  setViewingAs: (customer: ViewingAs | null) => void;
  /**
   * Customer whose data the pages show and create.
   * Customer: always their own id. Admin: the "Viewing as" customer, or null (= every customer).
   */
  customerId: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const VIEWING_AS_KEY = "mini-ats:viewing-as";

function readViewingAs(): ViewingAs | null {
  try {
    const raw = localStorage.getItem(VIEWING_AS_KEY);
    return raw ? (JSON.parse(raw) as ViewingAs) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [viewingAs, setViewingAsState] = useState<ViewingAs | null>(readViewingAs);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    // Do not await Supabase calls inside this callback (it can deadlock the auth client):
    // the profile is fetched by the query below, keyed on the user id.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(user?.id ?? "anonymous"),
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const profile = profileQuery.data ?? null;
  const isAdmin = profile?.role === "admin";

  const setViewingAs = useCallback((customer: ViewingAs | null) => {
    setViewingAsState(customer);
    try {
      if (customer) localStorage.setItem(VIEWING_AS_KEY, JSON.stringify(customer));
      else localStorage.removeItem(VIEWING_AS_KEY);
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setViewingAs(null);
    queryClient.clear();
  }, [queryClient, setViewingAs]);

  // A customer can never act as someone else, whatever is in localStorage.
  const effectiveViewingAs = isAdmin ? viewingAs : null;
  const customerId = !profile ? null : isAdmin ? (effectiveViewingAs?.id ?? null) : profile.id;

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading: sessionLoading || (!!user && profileQuery.isPending),
      isAdmin,
      signIn,
      signOut,
      viewingAs: effectiveViewingAs,
      setViewingAs,
      customerId,
    }),
    [session, user, profile, sessionLoading, profileQuery.isPending, isAdmin, signIn, signOut, effectiveViewingAs, setViewingAs, customerId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
