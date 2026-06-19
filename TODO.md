# Star Atlas Sourcer — Roadmap & TODO

The single source of truth for what's built and what's left. Contributors: grab anything in
**Open** that isn't claimed, open a branch, and check it off here in your PR.

> New here? Read [README.md](README.md) first (stack, setup, how the flow works), then pick a task.

**Status key:** ✅ done · 🚧 in progress · ⬜ open · 💡 idea / nice-to-have

---

## ✅ Done (MVP foundation)

- ✅ Next.js 16 + React 19 + TS + Tailwind v4 scaffold, Star Atlas / AEP Aephia dark theme
- ✅ Prisma 6 + SQLite data model: User, CollabRequest, RequestTemplate, Submission, SubmissionImage, Vote, Settings
- ✅ Auth (NextAuth v5): Discord OAuth + local dev-login bypass, role-based access (MEMBER / TEAM / ADMIN)
- ✅ Collab Requests: list view, detail page, create form (team/admin)
- ✅ Request spec template: aspect ratio, resolution, format, max file size, tier range, palette, style notes
- ✅ Reusable spec **templates** + **copy requirements from an existing request**
- ✅ Reference **background upload** per request
- ✅ **Output file name** field → controls the committed filename
- ✅ **Multi-image requests** (1–5): submitters must upload exactly the requested count; thumbnails show all
- ✅ Community **submit + upvote**; threshold (admin-set) promotes a submission to Team Review
- ✅ **Team Review** queue: accept (awards point + commits to GitHub) / reject; shows resulting filenames
- ✅ **Leaderboard** (points + accepted count)
- ✅ **Submissions gallery** tab with status filters
- ✅ **Admin dashboard**: upvote threshold, GitHub target (+ test connection), member role management
- ✅ **GitHub commit-on-accept** (Octokit), per-tier filenames (`warp-drive-t1.png` … `-t5.png`)

---

## ⬜ Open — to reach production

### Go-live / config
- ⬜ Register Discord OAuth app, set `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET`, set `ENABLE_DEV_LOGIN=false`
- ⬜ Set `GITHUB_TOKEN` (PAT w/ repo contents:write) and configure owner/repo/branch in Admin
- ⬜ Move DB from SQLite → Postgres for real hosting (update `prisma/schema.prisma` datasource)
- ⬜ Move uploads from local `public/uploads/` → object storage (S3 / R2 / Supabase) — see `lib/storage.ts`
- ⬜ Deploy (Vercel or similar); set all env vars in the host

### Correctness / robustness
- ⬜ Validate uploaded image **dimensions/aspect-ratio against the request spec** (currently only type + size checked) — `lib/storage.ts`, `app/actions/submissions.ts`
- ⬜ Rate-limit submissions & votes (anti-spam)
- ⬜ Server-side image processing: strip EXIF, optionally generate real thumbnails
- ⬜ Handle GitHub commit **retry** from the UI when a commit fails after accept (metadata stored per image)
- ⬜ Tests: unit (`lib/naming.ts`, vote threshold logic) + an e2e happy-path

---

## ⬜ Open — feature backlog

### Submissions & review
- ⬜ Submission **comments / feedback thread** (team ↔ creator)
- ⬜ Allow a creator to **edit / withdraw** a submission while still in voting
- ⬜ Per-image accept (accept some tiers of a set, request redo on others)
- ⬜ Lightbox / full-size viewer when clicking a thumbnail (currently links to the request)
- ⬜ Decide & implement: should submitters be able to add **more** than the requested image count? (currently exact)

### Requests
- ⬜ Request **deadlines** + auto-close
- ⬜ Request categories / tags + search & filter on the list
- ⬜ Let templates optionally carry a default title/description
- ⬜ Edit an existing request (only title/desc/status editable today)

### Leaderboard & profiles
- ⬜ Public **user profile** pages (their submissions, accepted assets, points)
- ⬜ Configurable points (e.g. weight by tier or request difficulty)
- ⬜ Time-boxed leaderboards (weekly / seasonal)

### Notifications
- ⬜ Notify creator on: promoted to review, accepted, rejected
- ⬜ Discord webhook: new request posted, submission accepted

---

## 💡 Ideas (not scoped yet)

- 💡 On-chain mapping of leaderboard points to rewards
- 💡 Discord role sync (guild roles → app roles)
- 💡 AI-assisted spec compliance check on upload
- 💡 Bulk export of accepted assets

---

## Known limitations / decisions on record

- **Exact image count** is enforced (not "at least"). Tracked above as an open decision.
- **Multi-accept naming:** each accepted image commits under a distinct tier/index suffix, so accepting
  multiple submissions for the same request no longer silently overwrites files.
- **Dev DB caveat:** stop the dev server before `prisma migrate dev` / `generate` on Windows (the running
  server locks the query-engine DLL → EPERM).
- **SQLite + local files** are intentionally a starting point — see the production tasks above.

---

## How to contribute (quick)

```bash
npm install
cp .env.example .env        # an .env with dev defaults already exists
npx prisma migrate dev
npm run db:seed
npm run dev                 # http://localhost:3000, use the Dev sign-in
```

1. Claim a task here (note your name next to it in your PR).
2. Branch, build, run `npx tsc --noEmit` and `npm run build` before pushing.
3. Update this file + the README if your change affects setup or the flow.
