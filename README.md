# UIUXMock

AI-powered UI/UX mockup generator. Describe a website or mobile app idea and get polished, Dribbble-quality HTML mockups rendered on an interactive canvas.

## Features

- **AI screen planning** — Gemini generates 1–4 screens with detailed layout descriptions
- **AI UI generation** — Each screen is rendered as HTML + Tailwind CSS
- **Interactive canvas** — Zoom, pan, drag, and resize screen frames
- **Theme system** — 6 built-in design themes with live preview
- **Screen editing** — Regenerate individual screens with natural language prompts
- **Export** — Download screenshots and copy full HTML code
- **Project management** — Save, revisit, and delete projects (Clerk auth required)

## Tech Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 · shadcn/ui
- Clerk (authentication)
- Neon PostgreSQL · Drizzle ORM
- OpenRouter (Google Gemini 2.5 Flash)

## Prerequisites

- **Node.js** 20.x or later
- Accounts on [Neon](https://neon.tech), [Clerk](https://clerk.com), and [OpenRouter](https://openrouter.ai)

## Getting Started (Local)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

On Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string (`?sslmode=require`) |
| `OPENROUTER_API_KEY` | Yes | API key from [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | No | AI model (default: `google/gemini-2.5-flash`) |
| `OPENROUTER_MAX_TOKENS_CONFIG` | Recommended | Token cap for screen planning (default: `1536`) |
| `OPENROUTER_MAX_TOKENS_UI` | Recommended | Token cap for UI generation (default: `4096`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Sign-in path (default: `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Sign-up path (default: `/sign-up`) |

> **OpenRouter credits:** AI routes require a funded OpenRouter account. If generation fails with a 402 error, add credits at [openrouter.ai/settings/credits](https://openrouter.ai/settings/credits).

### 3. Set up the database

Push the schema to your Neon database (run once locally, and again after schema changes):

```bash
npx drizzle-kit push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Production

**Live:** [https://uiuxmock-bice.vercel.app](https://uiuxmock-bice.vercel.app)

This app is a standard Next.js project and deploys cleanly to [Vercel](https://vercel.com) (recommended), or any platform that supports Next.js 16.

### 1. Prepare external services

**Neon**

1. Create a project and copy the **pooled** connection string.
2. Run `npx drizzle-kit push` locally against that database URL to create tables before first deploy.

**Clerk**

1. Create a Clerk application.
2. Add your production domain under **Configure → Domains** (e.g. `your-app.vercel.app`).
3. Copy **production** API keys (`pk_live_…`, `sk_live_…`).
4. Set sign-in/sign-up URLs to `/sign-in` and `/sign-up` if using the defaults.

**OpenRouter**

1. Create an API key and add credits.
2. Keep `OPENROUTER_MAX_TOKENS_CONFIG` and `OPENROUTER_MAX_TOKENS_UI` set in production — they prevent oversized credit reservations.

### 2. Deploy on Vercel

1. Push this repo to GitHub (or GitLab / Bitbucket).
2. Import the project in [Vercel](https://vercel.com/new).
3. Add **all** environment variables from `.env.example` in **Project → Settings → Environment Variables**.
4. Deploy. Vercel runs `npm run build` automatically.

No custom `next.config` changes are required. Auth is handled by `proxy.ts` (Clerk middleware for Next.js 16).

### 3. Post-deploy checklist

- [ ] Visit `/sign-in` and `/sign-up` on your live URL
- [ ] Create a test project and confirm AI generation works
- [ ] Confirm the dashboard loads saved projects
- [ ] Re-run `npx drizzle-kit push` if you change `config/schema.tsx`

### Deploy elsewhere

For self-hosted or other platforms (Railway, Render, Docker, etc.):

```bash
npm run build
npm run start
```

Set the same environment variables and ensure the platform supports Node.js 20+ and long-running API routes (AI generation can take 30–60 seconds per screen).

## Project Structure

```
app/
├── page.tsx                 # Home page & project dashboard
├── (auth)/                  # Clerk sign-in / sign-up
├── project/[projectId]/     # Canvas workspace
└── api/                     # Backend routes
    ├── project/             # CRUD for projects
    ├── user/                # User sync
    ├── generate-config/     # AI screen planning
    ├── generate-screen-ui/  # AI HTML generation
    └── edit-screen/         # AI screen editing
config/                      # DB schema, OpenRouter client
data/                        # AI prompts, themes, constants
lib/                         # Shared utilities
type/                        # TypeScript types
proxy.ts                     # Clerk auth middleware
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npx drizzle-kit push` | Push DB schema to Neon |
| `npx drizzle-kit studio` | Open Drizzle Studio |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **402 from OpenRouter** | Add credits; keep `OPENROUTER_MAX_TOKENS_*` env vars set |
| **404 model not found** | Use `google/gemini-2.5-flash` or another active model on OpenRouter |
| **DB connection timeout** | Check `DATABASE_URL`; use Neon pooled connection string |
| **Clerk redirect loop** | Add production domain in Clerk dashboard; verify sign-in URLs |
| **Build fails** | Run `npm run build` locally; fix TypeScript errors before deploying |

## License

Private — all rights reserved.
