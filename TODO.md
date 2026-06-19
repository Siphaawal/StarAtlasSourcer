# Star Atlas Sourcer — Roadmap & TODO

The single source of truth for what's built and what's left. Contributors: grab anything in
**Open** that isn't claimed, open a branch, and check it off here in your PR.

> New here? Read [README.md](README.md) first (stack, setup, how the flow works), then pick a task.

**Status key:** ✅ done · 🚧 in progress · ⬜ open · 💡 idea / nice-to-have
**Last updated:** 2026-06-19

Each open item is written to be **issue-ready** — copy it into a GitHub Issue and it carries enough context:
- **Why** — the goal / value
- **Where** — files & areas to touch
- **Done when** — acceptance criteria

---

## ✅ Done (MVP foundation)

- ✅ Next.js 16 + React 19 + TS + Tailwind v4 scaffold, Star Atlas / AEP Aephia dark theme
- ✅ Prisma 6 + SQLite data model: User, CollabRequest, RequestTemplate, Submission, SubmissionImage, Vote, Settings, ApiKey
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
- ✅ **Platform tagging** (Web / UE5) on requests + filtering on requests & submissions; UE5 "Coming Soon" tab
- ✅ **ATMTA usage disclaimer** on submission (required acknowledgment, recorded at submit time)
- ✅ **Agent API** — REST `POST/GET /api/v1/requests` with per-member API keys; DRAFT vs OPEN (optional publish);
  Admin key management + auto-publish toggle; **MCP server** (`create_collab_request` / `list_collab_requests`)
- ✅ **Image lightbox** — click a submission thumbnail on the request detail to view full-size (arrow/keys for sets)
- ✅ **Rewards & redemptions** — admin creates rewards (image, description, point cost, quantity); members redeem
  with points + a Solana wallet; availability counts down; admin payout queue (mark paid w/ optional tx, or
  cancel-and-refund); advertised on the leaderboard. Mock Star Atlas ship rewards seeded (`npm run rewards:seed`)

---

## ⬜ Open — Access & permissions

- ⬜ **(Future / to design) Gate submissions by Star Atlas guild level (e.g. Level 3, admin-configurable)**
  - **Status:** idea to revisit later — **not committed**. Leaving this here so we remember to think it through
    before building.
  - **Why:** restrict *submissions* to engaged/verified guild members — cut spam and low-effort entries — while
    browsing and voting stay open to all signed-in members.
  - **The hard part to think about:** Discord has **no native numeric "level."** Levels normally come from a
    leveling bot (MEE6 / Carl-bot, etc.) surfaced as **roles** (e.g. a "Level 3" role). So before building we need
    to decide how the app learns a member's level — most likely by reading their **roles** in the guild via the
    Discord `guilds.members.read` scope and mapping a configured role (or role set) to "minimum to submit," rather
    than a raw number. Levels change over time, so we'd refresh on login and/or offer a manual re-sync.
  - **Rough shape (when we build):** Discord `guilds.members.read` scope in `auth.ts`; persist level/roles on
    `User`; `Settings` (`guildId`, min role/level); server-side gate in `app/actions/submissions.ts`; a "you need
    Level N to submit" notice in `app/requests/[id]/SubmitForm.tsx`; admin config; dev-login simulates a level.
  - **Decided:** voting is **not** level-gated — see the voting item below.
  - **Done when (eventually):** a below-threshold member sees a blocked submit form with a clear explainer; an
    eligible member can submit; admin can change the threshold/role live; enforced server-side, not just hidden.

- ✅ **Voting requires sign-in (already enforced)** — `toggleVote` calls `requireUser()` and the vote button
  prompts unauthenticated visitors to sign in. Any signed-in member can vote; voting is **not** level-gated.

- ⬜ **Register the Discord OAuth app for production**
  - **Why:** turn on real login (dev bypass is local-only).
  - **Where:** create app at <https://discord.com/developers/applications>; redirect `…/api/auth/callback/discord`;
    set `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET`; set `ENABLE_DEV_LOGIN=false` in the host env.
  - **Done when:** members can sign in with Discord on the deployed site and the dev login is disabled.

---

## ⬜ Open — Infrastructure / go-live

- ⬜ **Set the GitHub commit target**
  - **Why:** commit-on-accept needs a real repo + token.
  - **Where:** `GITHUB_TOKEN` (PAT, repo contents:write) in host env; owner/repo/branch/path in Admin → GitHub.
  - **Done when:** accepting a submission commits its image(s) to the repo and "Test connection" passes.

- ⬜ **Move the database SQLite → Postgres**
  - **Why:** SQLite is single-file/local; production needs a managed DB.
  - **Where:** `prisma/schema.prisma` datasource (`provider = "postgresql"`), connection string in env, re-run
    migrations; review any SQLite-specific assumptions.
  - **Done when:** the app runs against Postgres locally and in the host with all migrations applied.

- ⬜ **Move uploads local files → object storage (S3 / R2 / Supabase)**
  - **Why:** `public/uploads/` doesn't persist on serverless hosts and won't scale.
  - **Where:** `lib/storage.ts` (`saveImage` / `saveImageBuffer` / `saveRemoteImage`) — swap disk writes for a
    storage client; store the returned public URL in `SubmissionImage.path` / `CollabRequest.backgroundPath`.
  - **Done when:** new uploads land in the bucket and render via their URLs; no code reads from `public/uploads/`.

- ⬜ **Deploy (Vercel or similar)**
  - **Why:** make it reachable for the guild.
  - **Where:** host project + all env vars (`DATABASE_URL`, `AUTH_*`, `GITHUB_TOKEN`, `NEXTAUTH_URL`, etc.).
  - **Done when:** a public URL is live, login works, and an end-to-end request→submit→review→commit cycle succeeds.

---

## ⬜ Open — Correctness / robustness

- ⬜ **Validate uploaded image dimensions/aspect-ratio against the request spec**
  - **Why:** today only MIME type + file size are checked; off-spec art still gets submitted.
  - **Where:** `lib/storage.ts` (read dimensions — e.g. `image-size` or `sharp`), `app/actions/submissions.ts`
    (compare against `resolution` / `aspectRatio`; reject or warn). Decide hard-reject vs soft-warn.
  - **Done when:** an image that doesn't match the request's resolution/ratio is rejected (or flagged) with a clear message.

- ⬜ **Rate-limit submissions, votes, and the API**
  - **Why:** prevent spam/abuse.
  - **Where:** `app/actions/submissions.ts`, `app/actions/votes.ts`, `app/api/v1/requests/route.ts` — per-user/key
    window (in-memory for dev; Redis/Upstash for prod).
  - **Done when:** rapid repeated actions are throttled with a friendly error.

- ⬜ **Server-side image processing (strip EXIF, generate thumbnails)**
  - **Why:** privacy (EXIF GPS) + faster galleries.
  - **Where:** `lib/storage.ts` using `sharp`; store a thumbnail variant alongside the original.
  - **Done when:** stored images carry no EXIF and the gallery/cards load a smaller thumbnail.

- ⬜ **Retry a failed GitHub commit from the UI**
  - **Why:** accept awards the point even if the commit fails (by design); need a way to re-commit later.
  - **Where:** new action that re-runs `commitAssetToGithub` for a submission's images using stored per-image
    metadata; a "Retry commit" button on accepted submissions in `app/team/page.tsx`.
  - **Done when:** an accepted submission whose commit failed can be re-committed without re-accepting.

- ⬜ **Tests (unit + e2e)**
  - **Why:** lock in core logic before it grows.
  - **Where:** unit for `lib/naming.ts` (filename rules) and the vote-threshold promotion in `app/actions/votes.ts`;
    one Playwright e2e happy-path (create → submit → vote past threshold → accept). Wire into CI.
  - **Done when:** `npm test` runs green locally and in CI on PRs.

---

## ⬜ Open — Feature backlog

### Submissions & review
- ⬜ **Submission comments / feedback thread (team ↔ creator)**
  - **Why:** let the team request tweaks without rejecting outright.
  - **Where:** new `Comment` model (submissionId, authorId, body, createdAt); UI on the request detail card and
    `app/team/page.tsx`; notify the creator (see Notifications).
  - **Done when:** team and creator can post/read messages on a submission.
- ⬜ **Let a creator edit/withdraw a submission while still in voting**
  - **Why:** fix mistakes before it hits review.
  - **Where:** actions to replace images / delete a submission while `status = PENDING`; UI affordance on own cards.
  - **Done when:** authors can update or remove their own submission before it reaches the threshold.
- ⬜ **Per-image accept for multi-image sets**
  - **Why:** accept some tiers, request a redo on others, instead of all-or-nothing.
  - **Where:** add status/decision per `SubmissionImage`; update `app/actions/review.ts` + the team review UI + GitHub commit loop.
  - **Done when:** the team can accept a subset of a set's images and only those commit.
- ⬜ **Extend the lightbox to the Submissions gallery tiles**
  - **Why:** the request-detail lightbox is ✅ done; gallery tiles still just link to the request.
  - **Where:** `app/submissions/page.tsx` — make tiles open `SubmissionLightbox` (or link, configurable).
  - **Done when:** clicking a gallery thumbnail opens the full-size viewer.
- ⬜ **Decide: allow MORE than the requested image count?**
  - **Why:** today submission count must be **exactly** `imageCount` (open product decision).
  - **Where:** `app/actions/submissions.ts` (min/max logic) + `SubmitForm` + naming in `lib/naming.ts` if variable.
  - **Done when:** the chosen policy (exact vs at-least) is implemented and documented.

### Requests
- ⬜ **Request deadlines + auto-close**
  - **Why:** time-box bounties.
  - **Where:** `CollabRequest.deadline DateTime?`; a scheduled route/cron that flips past-deadline OPEN→CLOSED;
    show a countdown on the detail page.
  - **Done when:** a request past its deadline stops accepting submissions automatically.
- ⬜ **Categories / tags + search & filter on the requests list**
  - **Where:** tags on `CollabRequest`; a search box + tag filter on `app/requests/page.tsx`.
  - **Done when:** users can find requests by text/tag.
- ⬜ **Templates can carry a default title/description**
  - **Where:** extend `RequestTemplate` + the apply-template logic in `app/requests/new/RequestForm.tsx`.
  - **Done when:** applying a template can prefill title/description too.
- ⬜ **Edit an existing request (all fields)**
  - **Why:** only title/desc/status are editable today (status toggle).
  - **Where:** an edit form reusing `RequestForm` + an update action.
  - **Done when:** team can fully edit a request's spec after creation.

### Leaderboard & profiles
- ⬜ **Public user profile pages**
  - **Where:** `/u/[id]` showing a member's submissions, accepted assets, and points.
  - **Done when:** clicking a name opens their profile.
- ⬜ **Configurable points (weight by tier / difficulty)**
  - **Where:** Admin setting + `app/actions/review.ts` point award; default stays 1.
  - **Done when:** accepting can award weighted points per the config.
- ⬜ **Time-boxed leaderboards (weekly / seasonal)**
  - **Where:** derive from `Submission.reviewedAt` / accepted timestamps; period selector on `app/leaderboard/page.tsx`.
  - **Done when:** the leaderboard can scope to a time window.

### Rewards (build-outs)
- ⬜ **Spendable vs. lifetime points** — today redeeming lowers leaderboard standing (single balance). Consider a
  separate lifetime-points field for ranking so spending doesn't drop a pilot's rank. (`User.points` + new field;
  update `app/actions/rewards.ts`, leaderboard, rewards page.)
- ⬜ **Notify the user when a redemption is marked paid** (in-app / Discord DM) — ties into Notifications below.
- ⬜ **Optional on-chain payout** — let the admin trigger an actual SPL/NFT transfer instead of manual send
  (would need a funded wallet + signing; big security surface — design carefully).
- ⬜ **Edit a reward** (cost/quantity/description/image) after creation — only create/toggle/delete exist today.

### Notifications
- ⬜ **Notify creators on status change (promoted / accepted / rejected)**
  - **Where:** in-app notifications model + optional Discord DM/email; hook into vote promotion + review actions.
  - **Done when:** a creator is notified when their submission changes state.
- ⬜ **Discord webhook for guild channels**
  - **Why:** surface activity where the guild lives.
  - **Where:** admin-configurable webhook URL; post on new request published / submission accepted.
  - **Done when:** configured events post to the Discord channel.

---

## ⬜ Open — UE5 assets (the "Coming Soon" tab is live as a placeholder)

- ⬜ **Define UE5 submission formats + storage** — meshes (`.fbx`/`.uasset`), materials, textures.
  - **Where:** extend `lib/storage.ts` allow-list + a non-image submission path; decide preview strategy.
  - **Done when:** UE5-type submissions accept the right file types and store safely.
- ⬜ **UE5-specific spec template fields** — poly budget, LODs, texel density, UV sets, collision.
  - **Where:** `CollabRequest` (UE5 fields, shown only when `targetUE5`), `RequestForm`, `SpecChips`.
- ⬜ **Validate uploads against UE5 specs** (poly count, etc., where feasible).
- ⬜ **UE5 asset preview** (thumbnail render or turntable) in submissions/review.
- ⬜ **Build out `/ue5`** from placeholder into a real browse/submit experience.
- ⬜ **Per-platform leaderboards** (Web vs UE5).
- ⬜ **GitHub commit pathing per platform** (e.g. `assets/web/…` vs `assets/ue5/…`) in `lib/github.ts` / `review.ts`.

---

## ⬜ Open — Legal

- ⬜ **Counsel review of the submission disclaimer**
  - **Where:** `SUBMISSION_DISCLAIMER` in `lib/constants.ts` — current text is a placeholder.
  - **Also:** version the text and store the accepted version per submission (`termsAcceptedAt` exists; add
    `termsVersion`) so you can prove which terms each creator agreed to.
  - **Done when:** the wording is lawyer-approved and the accepted version is recorded per submission.

---

## 💡 Ideas (not scoped yet)

- 💡 On-chain mapping of leaderboard points to rewards
- 💡 Discord role sync (guild roles → app roles) — overlaps with the Level-3 gating work above
- 💡 AI-assisted spec compliance check on upload
- 💡 Bulk export of accepted assets

---

## Known limitations / decisions on record

- **Voting:** signed-in members only (enforced today); **not** level-gated.
- **Submission gating:** any signed-in member can currently submit. A guild-level gate (e.g. Level 3) is a **future
  idea to design**, not committed — see Access & permissions.
- **Exact image count** is enforced (not "at least"). Open decision tracked above.
- **Multi-accept naming:** each accepted image commits under a distinct tier/index suffix, so accepting multiple
  submissions for the same request no longer silently overwrites files.
- **Dev DB caveat:** stop the dev server before `prisma migrate dev` / `generate` on Windows (the running server
  locks the query-engine DLL → EPERM).
- **SQLite + local files** are intentionally a starting point — see Infrastructure tasks above.

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
