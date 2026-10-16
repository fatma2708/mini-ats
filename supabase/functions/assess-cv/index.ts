// Edge Function : évaluation IA d'un CV par rapport à l'offre.
// Secrets : supabase secrets set ANTHROPIC_API_KEY=... (et optionnellement AI_MODEL=...)
// Déploiement : supabase functions deploy assess-cv
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Client avec le JWT de l'utilisateur : les règles RLS s'appliquent,
  // donc un client ne peut évaluer que ses propres candidats.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  const { candidate_id } = await req.json();
  const { data: c, error } = await supabase
    .from("candidates")
    .select("id, full_name, cv_text, linkedin_url, jobs(title, description)")
    .eq("id", candidate_id)
    .single();
  if (error || !c) {
    return new Response(JSON.stringify({ error: "Candidate not found" }), { status: 404, headers: cors });
  }
  if (!c.cv_text) {
    return new Response(JSON.stringify({ error: "No CV text for this candidate" }), { status: 400, headers: cors });
  }

  const job = c.jobs as { title: string; description: string | null };
  const prompt = `You are an assistant helping a recruiter screen candidates. Compare the CV with the job.
Return ONLY valid JSON with this shape:
{"score": <integer 0-100>, "summary": "<2 sentences>", "strengths": ["..."], "gaps": ["..."], "recommendation": "advance" | "maybe" | "reject"}
Judge only job-relevant skills and experience. Ignore name, gender, age, nationality, photo and any other personal attribute.

JOB TITLE: ${job.title}
JOB DESCRIPTION: ${job.description ?? "(none)"}

CV:
${c.cv_text.slice(0, 15000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("AI_MODEL") ?? "claude-haiku-5-5",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "AI request failed" }), { status: 502, headers: cors });
  }
  const body = await res.json();
  const text: string = body.content?.[0]?.text ?? "";
  let assessment;
  try {
    assessment = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    return new Response(JSON.stringify({ error: "Could not parse AI answer" }), { status: 502, headers: cors });
  }

  await supabase
    .from("candidates")
    .update({ ai_score: assessment.score, ai_assessment: assessment })
    .eq("id", c.id);

  return new Response(JSON.stringify(assessment), { headers: cors });
});
