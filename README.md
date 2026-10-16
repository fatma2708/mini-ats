# Mini ATS

A small multi-tenant **Applicant Tracking System**. Customers manage their jobs and move candidates through a Kanban pipeline; admins create accounts and can work on behalf of any customer. CVs are uploaded as PDF, their text is extracted in the browser, and an AI assessment compares the CV with the job description.

## Features

- **Landing page** (`/`): public presentation page; logged-in users are redirected to the board.
- **Login** with email and password. There is no public sign-up: accounts are created by an admin.
- **Board** (`/board`): Kanban with the stages Applied, Screening, Interview, Offer, Hired, Rejected.
  - Drag and drop between columns (optimistic update, rolled back if the save fails). Keyboard: focus a card, Space to pick it up, arrows to move, Space to drop, Enter to open.
  - Filters by job and by candidate name, stored in the URL (`/board?job=<id>&q=ana`), so a filtered view can be bookmarked or shared.
  - Count per column, AI score badge and LinkedIn link on each card.
- **Candidate drawer**: full profile, edit form, CV upload (private bucket), "Assess with AI" with score, summary, strengths, gaps and recommendation. The open candidate is in the URL too (`&candidate=<id>`).
- **Jobs** (`/jobs`): create, edit, close/reopen, with the number of candidates per job.
- **Admin** (`/admin`): list of every account, account creation (admin or customer), and a **Viewing as** selector in the top bar. When a customer is selected, every page shows and creates data for that customer, with an "Acting on behalf of …" banner.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), React Router |
| Data | `@supabase/supabase-js`, TanStack Query (cache, optimistic updates) |
| Drag and drop | `@dnd-kit/core` |
| PDF | `pdfjs-dist` (text extraction in the browser, lazy loaded) |
| Backend | Supabase: Postgres + Row Level Security, Auth, Storage, Edge Functions (Deno) |
| AI | Any OpenAI-compatible chat API (Groq by default), called only from the `assess-cv` edge function |

## Project structure

```
docs/design/                 Stitch HTML mockups the UI is based on (reference only, not built)
public/                      static assets (favicon)
supabase/
  schema.sql                 full schema for a new project: tables, RLS, triggers, storage bucket
  migrations/                changes to run on a database created with an older schema.sql
  functions/create-user/     admin-only account creation (uses the service role key server-side)
  functions/assess-cv/       AI assessment of a candidate's CV against the job
src/
  main.tsx                   providers (React Query, Router, Auth, toasts)
  App.tsx                    routes
  index.css                  design tokens (Tailwind v4 @theme) and type scale
  types.ts                   TypeScript types matching schema.sql (+ typed Database for supabase-js)
  lib/
    supabase.ts              Supabase client (anon key only)
    api.ts                   all data access: queries, mutations, storage, edge function calls
    pdf.ts                   PDF text extraction with pdf.js
    utils.ts                 small helpers (class names, dates, URL normalization)
  context/AuthContext.tsx    session, profile, role, "Viewing as" customer
  hooks/
    queries.ts               React Query hooks (jobs, candidates, optimistic stage move)
    useJobLabel.ts           job label with the company name in the admin "all customers" view
  pages/                     one file per route: Landing, Login, Board, Jobs, Admin
  components/
    ui/                      design-system primitives (shadcn/ui style): button, input, dialog…
    shared/                  app-wide building blocks: logo, badges, page header, empty state, form fields
    layout/                  app shell (sidebar, top bar, "Viewing as" banner) and route guard
    board/                   Kanban column, candidate card, empty pipeline
    candidates/              Add candidate dialog, candidate drawer
    jobs/                    New / edit job dialog
```

## Setup

Requirements: Node.js 20+, a Supabase project, the Supabase CLI (`npm i -g supabase`) and a Groq API key ([console.groq.com/keys](https://console.groq.com/keys)), or a key for another OpenAI-compatible provider (see [AI assessment](#ai-assessment)).

### 1. Database

In Supabase, open **SQL Editor > New query**, paste the content of `supabase/schema.sql` and run it.

Then in **Authentication**:
- **Sign In / Providers > Email**: disable "Confirm email" (accounts are created by the admin with a confirmed email anyway).
- **Settings**: turn **off "Allow new users to sign up"** (accounts are created by an admin, see [Security](#security)).

### 2. Edge functions

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set GROQ_API_KEY=<your-key>
# optional, see "AI assessment": AI_MODEL, AI_API_URL
supabase functions deploy create-user
supabase functions deploy assess-cv
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically into edge functions.

### 3. Frontend

```bash
cp .env.example .env.local   # then fill the two values (Project Settings > API)
npm install
npm run dev                  # http://localhost:5173
```

`.env.local` is git-ignored. It only contains the public URL and the **anon** key.

### 4. Create the first admin

There is no admin yet, so the first one is created from the Supabase dashboard:

1. **Authentication > Users > Add user > Create new user**: email + password, check "Auto confirm user".
   The `on_auth_user_created` trigger creates the matching row in `profiles` (role `customer`).
2. **SQL Editor**:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Log in to the app. The **Admin** menu appears; every other account is created from `/admin`.

## Deployment (Vercel)

1. Push the repository to GitHub, then **vercel.com > Add New > Project > Import** it. The Vite preset is detected (`npm run build`, output `dist`).
2. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then deploy.
3. In Supabase **Authentication > URL Configuration**, set the Site URL to the Vercel URL.

`vercel.json` rewrites every path to `index.html` so deep links like `/board?job=…` work on refresh. Any static host works the same way (Netlify, Cloudflare Pages) with an equivalent SPA rewrite.

## AI assessment

The "Assess with AI" button calls the `assess-cv` edge function. It reads the candidate with the caller's JWT (so RLS applies), sends the extracted CV text and the job description to the model, and stores the answer in `candidates.ai_score` and `candidates.ai_assessment`:

```json
{ "score": 0-100, "summary": "…", "strengths": ["…"], "gaps": ["…"], "recommendation": "advance | maybe | reject" }
```

**The provider is configurable.** The function makes a standard OpenAI-compatible `chat/completions` call (JSON mode, temperature 0.2), so any compatible provider works. It is set with edge function secrets:

| Secret | Default | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | (required) | API key, sent as `Authorization: Bearer …` |
| `AI_MODEL` | `openai/gpt-oss-120b` | Model id. On Groq, `llama-3.3-70b-versatile` also works; see [console.groq.com/docs/models](https://console.groq.com/docs/models) |
| `AI_API_URL` | `https://api.groq.com/openai/v1/chat/completions` | Endpoint, to use another OpenAI-compatible provider |

```bash
supabase secrets set AI_MODEL=llama-3.3-70b-versatile   # example: change the model
supabase functions deploy assess-cv                     # redeploy after changing secrets
```

The chosen model must support `response_format: { "type": "json_object" }`. For `gpt-oss` models the function also sends `reasoning_effort: "low"` and allows more completion tokens, because their reasoning counts against that limit. If the call fails, the details are logged in **Supabase > Edge Functions > assess-cv > Logs** and the user sees "AI request failed".

## Security

- **Tenant isolation is enforced by the database**, not by the UI. RLS policies on `jobs`, `candidates` and `storage.objects` only allow rows whose `customer_id` (or CV folder) is the logged-in user, unless `is_admin()` is true. The frontend filters by customer only for display ("Viewing as"); a customer cannot read another customer's data even with a crafted request.
- `candidates.customer_id` is always copied from the job by a trigger, so a candidate cannot be attached to someone else's tenant.
- A trigger prevents non-admins from changing their own `role`.
- The **service role key never reaches the browser**: only the `create-user` edge function uses it, after checking that the caller is an admin with the caller's own JWT.
- `assess-cv` runs with the caller's JWT, so RLS also applies to the AI feature. The AI provider key (`GROQ_API_KEY`) is an edge function secret and never reaches the browser.
- CVs are in a **private** bucket and are opened through short-lived (10 min) signed URLs.
- **Roles come from `app_metadata`.** `create-user` puts the role in `app_metadata`, and the `handle_new_user` trigger reads it from there. Only the service role key can write `app_metadata`. A user signing up through the public Auth API can set `user_metadata` but not their role, so they always get `customer`. If your database was created with an older `schema.sql` (role read from `user_metadata`), run `supabase/migrations/20261016000000_role_from_app_metadata.sql` and redeploy `create-user`.
- **Keep public sign-ups disabled** anyway: accounts are meant to be created only by an admin, and an open sign-up would let anyone create a (customer) account.

## Assumptions

- One account = one customer company (`profiles.company_name`); there are no teams or multiple users per customer.
- An admin with **Viewing as = All customers** sees every customer's board and jobs (read and edit). Creating a job requires picking a customer, because a job always belongs to one. Adding a candidate works in both modes since the job decides the owner.
- A candidate belongs to exactly one job and can only be moved to another job of the same customer.
- Closed jobs keep their candidates and stay visible in the board filter, but new candidates can only be added to open jobs.
- Only PDF CVs up to 10 MB are accepted. Scanned PDFs without a text layer upload fine but give no text, so the AI assessment is disabled for them (no OCR).
- The AI score is a screening aid; the prompt tells the model to ignore personal attributes (name, gender, age, nationality, photo).
- Replacing a CV deletes the old file and uploads the new one, because the storage policies allow insert and delete but not update.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |
