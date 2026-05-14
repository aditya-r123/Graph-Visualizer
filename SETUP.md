# Pro / AI Setup Guide

The editor itself is open to anonymous users. AI features (graph generation,
TXT hierarchy export) are gated behind a paid **Pro** plan, enforced
server-side. This guide walks through the one-time external setup.

If you only want to develop the non-AI editor, skip this file — the app runs
without any of these env vars, with AI features showing a "sign in / upgrade"
hint.

---

## 1. Supabase (auth + user storage)

1. Sign up at [supabase.com](https://supabase.com), create a **new project**
   (free tier is fine). Pick a strong DB password.
2. Once provisioned, go to **Project Settings → API** and copy:
   - `Project URL` → goes into `SUPABASE_URL`
   - `anon public` key → goes into `SUPABASE_ANON_KEY`
   - `service_role secret` key → goes into `SUPABASE_SERVICE_ROLE_KEY`
3. **Authentication → Providers** → enable **Email**. For testing, also
   uncheck "Confirm email" so accounts work without inbox verification.
   (Re-enable for production.)
4. **Authentication → URL Configuration**: set Site URL to your prod domain
   (e.g. `https://graphvisualizer.com`) and add `http://localhost:3005` as
   a Redirect URL for local dev.
5. **SQL Editor** → paste the contents of `supabase/schema.sql` and run.
   This creates:
   - The `profiles` table + auto-create-on-signup trigger + RLS policies
   - The `graphs` table for cross-device "Canvas Management" sync + RLS policies

   If you already ran an older copy of this file, re-running is safe — every
   statement uses `IF NOT EXISTS` / `CREATE OR REPLACE` / `DROP POLICY IF
   EXISTS` so re-applying it just adds the new `graphs` table.

## 2. Stripe (payments)

1. Sign up at [stripe.com](https://stripe.com). Stay in **Test mode** until
   you're ready to take real payments.
2. **Products → Add product**:
   - Name: "Graph Visualizer Pro" (or whatever)
   - Pricing model: **Recurring**, monthly, e.g. $5.00/mo
   - Save and copy the `Price ID` (starts with `price_...`) → goes into
     `STRIPE_PRICE_ID`.
3. **Developers → API keys**: copy both keys:
   - **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`. Server-only, keep secret.
   - **Publishable key** (`pk_test_...`) → `STRIPE_PUBLISHABLE_KEY`. Safe to expose to browser; used by Stripe.js to mount the embedded checkout form inline.
4. **Customer portal** ([dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)):
   click "Activate test link" so the `/api/stripe/portal` route works.

### 2a. Webhook — local development

Install the Stripe CLI and forward webhooks to your dev server:

```bash
brew install stripe/stripe-cli/stripe   # or see https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3005/api/stripe/webhook
```

`stripe listen` prints `Ready! Your webhook signing secret is whsec_...` —
copy that into `STRIPE_WEBHOOK_SECRET` in your `.env`, and **keep this
command running** while developing. Each Pro purchase / cancellation will
fire events the CLI forwards to your local server.

### 2b. Webhook — production (Vercel)

1. Deploy the app to Vercel.
2. Stripe Dashboard → **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-DOMAIN/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`
3. After creating, click the endpoint, reveal **Signing secret**, copy it
   into the Vercel `STRIPE_WEBHOOK_SECRET` env var.

## 3. `.env` (local dev)

Copy `.env.example` to `.env` and fill in everything from steps 1 + 2. Keys
needed at minimum:

| Var | Source |
| --- | --- |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `SUPABASE_URL` | Supabase project settings |
| `SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings (secret!) |
| `STRIPE_SECRET_KEY` | Stripe Developers → API keys |
| `STRIPE_PRICE_ID` | Stripe Products |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` output (dev) or Stripe Dashboard (prod) |
| `APP_ORIGIN` | `http://localhost:3005` in dev, `https://your-domain` in prod |

## 4. Vercel deployment

Set all of the above in **Vercel → Project → Settings → Environment Variables**.
Note that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are referenced at *build* time
(webpack inlines them into the client bundle), so adding/changing them
requires a redeploy, not just a serverless function invalidation.

`vercel.json` rewrites already handle `/` and `/editor`; Vercel auto-discovers
`/api/**/*.js` as serverless functions.

## 5. Local dev workflow

```bash
npm install
npm run dev                     # webpack watch + nodemon server.js
# in a second terminal:
stripe listen --forward-to localhost:3005/api/stripe/webhook
```

Visit `http://localhost:3005/editor`, click **Sign in** in the sidebar
header, create a test account, then click **Upgrade** to walk through Stripe
Checkout. Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC.
After the redirect back to the editor, the chip should flip to **PRO** and
AI features should work.

## 6. Architecture cheat sheet

```
browser            Vercel / Express
─────────         ─────────────────
client            /api/me                  ← who am I + plan?
  │               /api/ai/generate-graph   ← verifies JWT + plan, calls OpenAI
  │               /api/ai/hierarchy        ← (same)
  │               /api/stripe/create-checkout
  │               /api/stripe/portal
  │               /api/stripe/webhook      ← updates profiles.plan on events
  │
  └── @supabase/supabase-js  ←→  Supabase (auth + profiles table)
                                 │
                                 └── RLS: users only see their own row
```

The browser never holds the OpenAI key or the Stripe secret. The only key
that ships to the client is the Supabase anon key, which is safe because
Row Level Security restricts what it can read.
