import { FunctionsHttpError } from "@supabase/supabase-js";
import { CV_BUCKET, supabase } from "@/lib/supabase";
import { extractPdfText } from "@/lib/pdf";
import type {
  AiAssessment,
  Candidate,
  CandidateInsert,
  CandidateUpdate,
  CandidateWithJob,
  CreateUserInput,
  Job,
  JobInsert,
  JobUpdate,
  Profile,
} from "@/types";

/**
 * Data access layer. `customerId` scopes a query to one customer:
 * - customers always pass their own id (RLS would hide other rows anyway),
 * - admins pass the "Viewing as" customer, or null to see every customer.
 */

export const queryKeys = {
  profile: (id: string) => ["profile", id] as const,
  profiles: ["profiles"] as const,
  jobs: (customerId: string | null) => ["jobs", customerId ?? "all"] as const,
  candidates: (customerId: string | null) => ["candidates", customerId ?? "all"] as const,
};

// ---------- Profiles ----------

export async function getProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

/** All accounts (admins only, enforced by RLS). */
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ---------- Jobs ----------

export async function listJobs(customerId: string | null): Promise<Job[]> {
  let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (customerId) q = q.eq("customer_id", customerId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createJob(input: JobInsert): Promise<Job> {
  const { data, error } = await supabase.from("jobs").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateJob(id: string, patch: JobUpdate): Promise<Job> {
  const { data, error } = await supabase.from("jobs").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

// ---------- Candidates ----------

const CANDIDATE_SELECT = "*, jobs(id, title)" as const;

export async function listCandidates(customerId: string | null): Promise<CandidateWithJob[]> {
  let q = supabase.from("candidates").select(CANDIDATE_SELECT).order("created_at", { ascending: false });
  if (customerId) q = q.eq("customer_id", customerId);
  const { data, error } = await q;
  if (error) throw error;
  return data as CandidateWithJob[];
}

export async function createCandidate(input: CandidateInsert): Promise<CandidateWithJob> {
  const { data, error } = await supabase.from("candidates").insert(input).select(CANDIDATE_SELECT).single();
  if (error) throw error;
  return data as CandidateWithJob;
}

export async function updateCandidate(id: string, patch: CandidateUpdate): Promise<CandidateWithJob> {
  const { data, error } = await supabase
    .from("candidates")
    .update(patch)
    .eq("id", id)
    .select(CANDIDATE_SELECT)
    .single();
  if (error) throw error;
  return data as CandidateWithJob;
}

export async function deleteCandidate(candidate: Pick<Candidate, "id" | "cv_path">): Promise<void> {
  if (candidate.cv_path) {
    // Best effort: a missing file must not block the deletion.
    await supabase.storage.from(CV_BUCKET).remove([candidate.cv_path]);
  }
  const { error } = await supabase.from("candidates").delete().eq("id", candidate.id);
  if (error) throw error;
}

// ---------- CVs ----------

export function cvPath(candidate: Pick<Candidate, "id" | "customer_id">) {
  return `${candidate.customer_id}/${candidate.id}.pdf`;
}

/**
 * Uploads the PDF to the private `cvs` bucket under <customer_id>/<candidate_id>.pdf,
 * extracts its text in the browser and stores both on the candidate.
 */
export async function uploadCv(candidate: Pick<Candidate, "id" | "customer_id">, file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please choose a PDF file.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("The PDF must be smaller than 10 MB.");

  const text = await extractPdfText(file);
  const path = cvPath(candidate);
  const bucket = supabase.storage.from(CV_BUCKET);

  // The storage policies allow insert + delete but not update, so replace = remove then upload.
  await bucket.remove([path]);
  const { error: uploadError } = await bucket.upload(path, file, { contentType: "application/pdf" });
  if (uploadError) throw uploadError;

  return updateCandidate(candidate.id, { cv_path: path, cv_text: text || null });
}

export async function getCvSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(CV_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

// ---------- Edge functions ----------

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    // Surface the `{ error: "..." }` message returned by our edge functions.
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      if (payload?.error) throw new Error(payload.error);
    }
    throw error;
  }
  return data as T;
}

export function assessCv(candidateId: string) {
  return invokeFunction<AiAssessment>("assess-cv", { candidate_id: candidateId });
}

export function createUser(input: CreateUserInput) {
  return invokeFunction<{ id: string }>("create-user", { ...input });
}
