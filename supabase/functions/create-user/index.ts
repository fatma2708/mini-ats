// Edge Function : création de comptes (admin ou customer), réservée aux admins.
// Déploiement : supabase functions deploy create-user
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: isAdmin } = await caller.rpc("is_admin");
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });
  }

  const { email, password, full_name, company_name, role } = await req.json();
  if (!email || !password || !["admin", "customer"].includes(role)) {
    return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: cors });
  }

  const admin = createClient(url, serviceKey);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, company_name },
    // app_metadata can only be written with the service role key, so a user
    // signing up through the public Auth API cannot choose their own role.
    app_metadata: { role },
  });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: cors });
  }
  return new Response(JSON.stringify({ id: data.user.id }), { headers: cors });
});
