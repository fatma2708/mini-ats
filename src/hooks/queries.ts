import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api";
import { queryKeys } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/utils";
import type { CandidateUpdate, CandidateWithJob, Stage } from "@/types";

export function useJobs() {
  const { customerId } = useAuth();
  return useQuery({ queryKey: queryKeys.jobs(customerId), queryFn: () => api.listJobs(customerId) });
}

export function useCandidates() {
  const { customerId } = useAuth();
  return useQuery({ queryKey: queryKeys.candidates(customerId), queryFn: () => api.listCandidates(customerId) });
}

export function useProfiles(enabled = true) {
  return useQuery({ queryKey: queryKeys.profiles, queryFn: api.listProfiles, enabled });
}

/** Invalidates every cached jobs/candidates list (all "viewing as" scopes). */
export function useInvalidateData() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["candidates"] });
  };
}

/** Writes an updated candidate into the current board cache without refetching. */
export function useSetCandidateInCache() {
  const qc = useQueryClient();
  const { customerId } = useAuth();
  return (candidate: CandidateWithJob) => {
    qc.setQueryData<CandidateWithJob[]>(queryKeys.candidates(customerId), (old) =>
      old?.map((c) => (c.id === candidate.id ? candidate : c)),
    );
  };
}

/** Moves a card to another column with an optimistic update and rollback on error. */
export function useMoveCandidate() {
  const qc = useQueryClient();
  const { customerId } = useAuth();
  const key = queryKeys.candidates(customerId);

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: Stage }) => api.updateCandidate(id, { stage }),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<CandidateWithJob[]>(key);
      qc.setQueryData<CandidateWithJob[]>(key, (old) => old?.map((c) => (c.id === id ? { ...c, stage } : c)));
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(`Could not move candidate: ${errorMessage(err)}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useUpdateCandidate() {
  const setInCache = useSetCandidateInCache();
  const invalidate = useInvalidateData();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CandidateUpdate }) => api.updateCandidate(id, patch),
    onSuccess: (candidate) => {
      setInCache(candidate);
      invalidate();
    },
  });
}
