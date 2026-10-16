// Types mirroring supabase/schema.sql. Keep in sync if the schema changes
// (or regenerate with `supabase gen types typescript`).

export const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export type Role = "admin" | "customer";
export type JobStatus = "open" | "closed";
export type Recommendation = "advance" | "maybe" | "reject";

/** Shape returned by the `assess-cv` edge function and stored in candidates.ai_assessment. */
export type AiAssessment = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: Recommendation;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: Role;
  created_at: string;
};

export type Job = {
  id: string;
  customer_id: string;
  title: string;
  description: string | null;
  location: string | null;
  status: JobStatus;
  created_at: string;
};

export type Candidate = {
  id: string;
  job_id: string;
  customer_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  cv_path: string | null;
  cv_text: string | null;
  notes: string | null;
  stage: Stage;
  ai_score: number | null;
  ai_assessment: AiAssessment | null;
  created_at: string;
  updated_at: string;
};

/** Candidate row joined with its job title (used by the board). */
export type CandidateWithJob = Candidate & { jobs: { id: string; title: string } | null };

export type ProfileInsert = Pick<Profile, "id" | "email"> & Partial<Omit<Profile, "id" | "email">>;
export type JobInsert = Pick<Job, "customer_id" | "title"> & Partial<Omit<Job, "id" | "customer_id" | "title">>;
// customer_id is overwritten by the `set_candidate_customer` trigger from the job.
export type CandidateInsert = Pick<Candidate, "job_id" | "customer_id" | "full_name"> &
  Partial<Omit<Candidate, "id" | "job_id" | "customer_id" | "full_name" | "created_at" | "updated_at">>;

export type JobUpdate = Partial<Omit<Job, "id" | "customer_id" | "created_at">>;
export type CandidateUpdate = Partial<Omit<Candidate, "id" | "customer_id" | "created_at" | "updated_at">>;
export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      jobs: {
        Row: Job;
        Insert: JobInsert;
        Update: JobUpdate;
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      candidates: {
        Row: Candidate;
        Insert: CandidateInsert;
        Update: CandidateUpdate;
        Relationships: [
          {
            foreignKeyName: "candidates_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidates_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

/** Input of the `create-user` edge function. */
export type CreateUserInput = {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  role: Role;
};
