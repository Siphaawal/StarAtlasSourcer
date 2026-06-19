# Star Atlas Sourcer

A community-sourced asset bounty & review pipeline for **Star Atlas**, themed for the **AEP / Aephia guild**.

The team posts asset bounties → the community generates and submits art → pilots upvote → submissions that
cross a configurable threshold enter team review → accepted assets are committed to a GitHub repo and the
creator earns a leaderboard point.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — custom Star Atlas / Aephia dark theme
- **Prisma 6 + SQLite** (local-first; swap the datasource for Postgres later)
- **Auth.js / NextAuth v5** — Discord OAuth, with a local **dev login bypass**
- **Octokit** — commits accepted assets to a configured GitHub repo
- Local file storage under `public/uploads/`

## Roles

| Role | Can |
|------|-----|
| **MEMBER** | submit assets, upvote submissions |
| **TEAM** | + post collab requests, review threshold-passed submissions |
| **ADMIN** | + change settings (upvote threshold, GitHub target), manage roles |

## Getting started

```bash
npm install
cp .env.example .env        # then edit values (an .env with dev defaults is already present)
npx prisma migrate dev      # creates the SQLite db
npm run db:seed             # seeds Settings + sample users + a sample request
npm run dev                 # http://localhost:3000
```

### Sign in (local)

`ENABLE_DEV_LOGIN="true"` (default) shows a **Dev sign-in** on `/signin` — pick any username and a role
(MEMBER / TEAM / ADMIN) without needing Discord. **Set it to `false` in production.**

### Enable Discord login

1. Create an app at <https://discord.com/developers/applications>
2. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
3. Set `AUTH_DISCORD_ID` and `AUTH_DISCORD_SECRET` in `.env`

### Enable GitHub commit-on-accept

1. Create a Personal Access Token with **repo contents: write** access
2. Set `GITHUB_TOKEN` in `.env`
3. In the **Admin** dashboard, set the owner / repo / branch / path prefix and click **Test connection**

When the team accepts a submission, the image is committed to
`<owner>/<repo>/<pathPrefix>/<asset>-<author>-<id>.<ext>` on the chosen branch.

## How the flow works

1. **Team** posts a Collab Request on `/requests/new` — title, description, asset type, tier range, and a
   spec template (aspect ratio, resolution, format, max file size, color palette, style notes) plus an optional
   reference **background** upload.
2. Requests appear on **`/requests`**. A member opens one and submits an image on the detail page.
3. Submissions gather **community upvotes**. When a submission reaches the admin-set threshold it is promoted to
   **TEAM_REVIEW** and removed from the public voting pool.
4. **`/team`** shows the review queue. **Accept** → author gets a point + GitHub commit; **Reject** → archived.
5. **`/leaderboard`** ranks pilots by points.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / serve |
| `npm run db:migrate` | run Prisma migrations |
| `npm run db:seed` | seed sample data |
| `npm run db:studio` | open Prisma Studio |
| `npm run db:reset` | reset the database |

## Project layout

```
app/
  actions/        server actions (requests, submissions, votes, review, settings)
  requests/       list, detail (+ submit/vote), new
  team/           review queue
  admin/          settings + role management
  leaderboard/    rankings
  signin/         auth page
auth.ts           NextAuth config (Discord + dev login)
lib/              prisma, auth helpers, storage, github, settings
prisma/           schema, migrations, seed
components/       Navbar, cards, badges, vote button
```

## Notes / next steps

- SQLite + local file storage is for getting started. For production, move the Prisma datasource to Postgres
  and uploads to object storage (S3 / R2 / Supabase storage).
- Future ideas: submission comments, per-request deadlines, on-chain point mapping, image dimension validation
  against the request spec, Discord role sync.
