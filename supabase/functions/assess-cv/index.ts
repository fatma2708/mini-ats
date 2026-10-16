// Edge Function : évaluation IA d'un CV par rapport à l'offre.
// Fournisseur : API compatible OpenAI (Groq par défaut).
// Secrets : supabase secrets set GROQ_API_KEY=...
//   optionnels : AI_MODEL=... (défaut : openai/gpt-oss-120b), AI_API_URL=... (autre fournisseur compatible OpenAI)
// Déploiement : supabase functions deploy assess-cv
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const AI_API_URL = Deno.env.get("AI_API_URL") ?? "https://api.groq.com/openai/v1/chat/completions";
const AI_MODEL = Deno.env.get("AI_MODEL") ?? "openai/gpt-oss-120b";

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

  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI provider is not configured" }), { status: 500, headers: cors });
  }

  // Les modèles gpt-oss raisonnent avant de répondre : le raisonnement compte dans
  // max_completion_tokens, d'où une marge plus large et un effort "low" (suffisant ici).
  const isGptOss = AI_MODEL.includes("gpt-oss");
  const res = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_completion_tokens: isGptOss ? 2048 : 800,
      ...(isGptOss ? { reasoning_effort: "low" } : {}),
    }),
  });
  if (!res.ok) {
    // Détail visible dans les logs de la fonction (Supabase > Edge Functions > Logs), pas renvoyé au client.
    console.error("AI request failed", res.status, await res.text());
    return new Response(JSON.stringify({ error: "AI request failed" }), { status: 502, headers: cors });
  }
  const body = await res.json();
  const text: string = body.choices?.[0]?.message?.content ?? "";
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
