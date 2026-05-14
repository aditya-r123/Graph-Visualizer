# Graph Visualizer

An interactive, browser-based graph editor with AI-assisted generation and algorithm animations. Sketch graphs by hand, prompt one in plain English, or extract a hierarchy from an image — then export, share, or animate BFS/DFS on it.

Live: [graphvisualizer.com](https://graphvisualizer.com)

## Free features

Available to anyone, no sign-up required:

- **Interactive editor** — Left-click to add vertices, drag to move, right-click two vertices to connect them with weights.
- **Edit mode** — Long-press a vertex (2.5s) to edit labels, sizes, colors, and shapes.
- **Delete mode** — Bulk delete vertices and edges.
- **Local-first auto-save** — Work persists in the browser; manual save/load and drag-and-drop JSON files supported.
- **Export** — Download as PNG, JPG, or JSON.
- **Share** — Generate a shareable image of the current canvas.

## Pro features

Available with a Pro subscription (managed in the account section on the home page):

- **AI graph generation** — Describe a graph in plain English; the editor builds it.
- **AI hierarchy export** — Upload an image of a tree/hierarchy and convert it into an editable graph.
- **BFS & DFS animations** — Run search from any vertex, with frontier/visited/path states animated step by step.
- **TXT export** — Plaintext edge-list export, in addition to the free formats.
- **Priority OpenAI access** and a daily usage cap to keep costs predictable.

## Tech stack

- Vanilla JS frontend, bundled with webpack.
- Express server (`server.js`) for local dev; Vercel serverless functions (`api/`) for production.
- **Supabase** for auth and the `profiles` table (plan + Stripe IDs).
- **Stripe** for subscriptions; embedded checkout on the landing page, Customer Portal for management. Webhook at `api/stripe/webhook.js` keeps `profiles.plan` in sync.
- **OpenAI** for AI generation and hierarchy extraction (server-side only).

## Local development

```bash
npm install
npm run dev   # starts webpack --watch + nodemon on :3005
```

Create a `.env` with the keys you need: `OPENAI_API_KEY`, `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, and the Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`). Auth, billing, and AI features each require their corresponding env vars; the editor itself works without any of them.

## License

MIT.
