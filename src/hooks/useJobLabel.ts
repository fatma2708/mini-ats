import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/hooks/queries";
import type { Job } from "@/types";

/**
 * Label for a job in selects. When an admin looks at every customer at once,
 * the company is appended so jobs with the same title can be told apart.
 */
export function useJobLabel() {
  const { isAdmin, customerId } = useAuth();
  const showCompany = isAdmin && !customerId;
  const { data: profiles = [] } = useProfiles(showCompany);

  return (job: Pick<Job, "title" | "customer_id">) => {
    if (!showCompany) return job.title;
    const owner = profiles.find((p) => p.id === job.customer_id);
    return owner ? `${job.title} · ${owner.company_name || owner.email}` : job.title;
  };
}
