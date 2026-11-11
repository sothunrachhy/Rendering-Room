# RoomFinder

A web app that helps university students in Phnom Penh find verified, affordable rooms near their campus. Students search by campus, budget and distance; rooms are ranked by distance, price and rating and shown on a map. Landlords post rooms for free once an admin has checked their ID. Everything is in **English and Khmer (ខ្មែរ)**.

Project Practicum, Royal University of Phnom Penh. Lecturer: Chhim Bunchhun.

## Features

| Student                                                 | Landlord                                             | Admin                                              |
| ------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| Sign up and log in                                      | Sign up, upload an ID photo for verification         | Verify landlords (approve or reject with a reason) |
| Search by campus, budget, distance, type, facilities    | Post and edit rooms, pin the location on a map       | Hide and show listings                             |
| Results ranked by the scoring algorithm, on a map       | Upload photos (resized in the browser), pick a cover | Handle reports from students                       |
| Full monthly cost: rent, utilities, fees, deposit       | Mark rooms available or rented                       | Dashboard: rooms, users, requests, reports         |
| Save favourites                                         | Accept or decline viewing requests with a reply      |                                                    |
| Request a viewing; landlord's phone shown once accepted | Telegram alerts for new requests                     |                                                    |
| Rate and review, only after an accepted viewing         |                                                      |                                                    |
| Report a listing                                        |                                                      |                                                    |

Also: dark mode, works on phones and can be installed to the home screen (web app manifest), Telegram alerts for students too.

## The search and ranking algorithm (slides 15–16)

[src/lib/ranking.ts](src/lib/ranking.ts) is the algorithm from the presentation:

1. The database keeps **available** rooms from **verified** landlords **within budget**, inside a bounding box around the campus ([src/server/queries/rooms.ts](src/server/queries/rooms.ts)).
2. For each room, the **Haversine** distance `d` to the campus; rooms with `d > max distance` are skipped.
3. **Score = 0.5 × (1 − d / d_max) + 0.3 × (1 − price / budget) + 0.2 × (rating / 5)**, sorted highest first.

One addition: a room with **no reviews yet counts as 3/5**. Otherwise every new listing would score 0 on rating and always sink to the bottom.

The sample data includes Room A and Room B from the worked example. Search **RUPP, $120, 3 km** and Room B shows "60% match" above Room A's "58% match", exactly as on slide 16. [src/lib/ranking.test.ts](src/lib/ranking.test.ts) checks those numbers.

## Tech stack

Same stack and structure as the Finance Tracker project:

| Area       | Choice                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Components, Server Actions), TypeScript |
| Database   | PostgreSQL 16 with Drizzle ORM and SQL migrations                      |
| Auth       | bcrypt password hashing + signed JWT session cookie, three roles       |
| UI         | Tailwind CSS v4, shadcn/ui (Base UI), lucide icons                     |
| Maps       | Leaflet + OpenStreetMap (free, no API key)                             |
| Files      | Room photos and ID photos stored in PostgreSQL (no extra service)      |
| Alerts     | Telegram Bot API; email (password reset) through Resend                |
| Validation | Zod, shared by forms and server                                        |
| Testing    | Vitest (unit), Playwright (end-to-end), GitHub Actions CI              |

> **Differs from the slides:** slides 13–14 describe React + Vite, an Express API, Prisma, React Native and Cloudinary. This build uses the Finance Tracker stack instead: one Next.js app is both the web front end and the API, Drizzle replaces Prisma, and photos live in PostgreSQL. The mobile version is the same responsive site, installable on Android and iOS, instead of a separate React Native app. Update slides 7, 13 and 14 to match before presenting.

## Running it locally

You need Node.js 22+ and PostgreSQL 16.

1. Install packages:

   ```bash
   npm install
   ```

2. Start PostgreSQL, either with Docker (port 5438):

   ```bash
   npm run db:up
   ```

   or with **ServBay**: start PostgreSQL in ServBay, create a database called `roomfinder`, and use its port (5432) and password in the next step.

3. Create `.env` from the example and set a session secret:

   ```bash
   cp .env.example .env
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

   Paste the output into `SESSION_SECRET`, and fix `DATABASE_URL` if you use ServBay.

4. Create the tables and the sample data:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the app and open http://localhost:3000:

   ```bash
   npm run dev
   ```

### Sample accounts

All passwords are `password123`, except the admin's (`admin12345`, or `SEED_ADMIN_PASSWORD` from `.env`).

| Email                     | Role                                     |
| ------------------------- | ---------------------------------------- |
| `admin@roomfinder.local`  | Admin                                    |
| `sokha@roomfinder.local`  | Verified landlord (owns Rooms A and B)   |
| `vanna@roomfinder.local`  | Verified landlord, has a viewing request |
| `chenda@roomfinder.local` | Landlord waiting for verification        |
| `dara@roomfinder.local`   | Student (accepted viewings, can review)  |
| `sophea@roomfinder.local` | Student                                  |

`npm run db:seed -- --reset` deletes **everything** and starts over with the sample data.

The sample rooms come with real interior photos from Unsplash ([scripts/sample-photos](scripts/sample-photos/CREDITS.md)). For a database seeded before the photos were added, `npm run db:sample-photos` attaches them; it only fills rooms that have no photos yet. They aren't photos of the actual rooms, so replace them with landlords' own photos before the pilot.

The three campus locations (RUPP, ITC, NUM) in [scripts/seed.ts](scripts/seed.ts) are approximate. Check them on openstreetmap.org before the pilot.

### Email confirmation and login protection

- New accounts get a "confirm your email" message. Students can browse and save rooms straight away, but can request viewings only after opening the link, so landlords only hear from real addresses. Without `RESEND_API_KEY` the email (and its link) is printed in the terminal running `npm run dev`. Accounts created before this feature, and the sample accounts, count as confirmed.
- Five wrong passwords for one email lock that account for 15 minutes; 30 failures from one network lock that network. Sign-ups are limited to 10 an hour per network. Attempts are counted in the database (`auth_attempts`), so the limits hold across server instances.
- Passwords must be 8+ characters and not a common or digits-only password; names can't contain markup characters.

### Telegram alerts (optional)

Without a bot, alerts are printed in the terminal. To send real messages:

1. In Telegram, message **@BotFather**, send `/newbot`, and copy the token and the bot's username.
2. Add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` and a random `TELEGRAM_WEBHOOK_SECRET` to `.env`.
3. Locally, run `npm run telegram:poll` next to `npm run dev`. It forwards bot messages to the app, because Telegram can't reach localhost.
4. In the app, open **Settings → Connect Telegram**, press **Start** in Telegram, and reload.

When deployed, register the webhook once instead of polling:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-domain>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

## Tests and checks

```bash
npm test             # unit tests (ranking, costs, validation, translations…)
npm run lint
npm run typecheck
npm run build && npm run test:e2e   # browser tests; need the seeded database
```

The end-to-end tests cover the whole story: a landlord posts a room with a photo, it stays hidden until an admin approves the landlord's ID, a student saves it and requests a viewing, the landlord accepts, the student sees the phone number and reviews, and a report gets the room hidden. They create their own accounts and rooms, so after running them locally you may want `npm run db:seed -- --reset` for a clean demo.

## Project structure

```
src/
  app/[lang]/(public)/      home, search (/rooms), room page (/rooms/[id])
  app/[lang]/(app)/         signed-in pages: saved, requests, listings, admin, settings
  app/[lang]/(auth)/        login, register, forgot/reset password
  app/api/                  photo upload/serving, ID upload, Telegram webhook
  components/               UI (rooms, map, listings, admin, settings, shadcn/ui)
  db/schema.ts              database tables
  i18n/dictionaries/        English and Khmer text
  lib/                      ranking, costs, validation, time (Phnom Penh)
  server/                   auth, sessions, email, Telegram, access rules (policies.ts)
  server/actions/           Server Actions (every one checks the user's role)
  server/queries/           database reads
scripts/                    seed data, Telegram polling for local development
tests/e2e/                  Playwright tests
```

## Deploying

Like the Finance Tracker: Vercel for the app plus a hosted PostgreSQL (Neon, Supabase or Render). Set `DATABASE_URL`, `SESSION_SECRET`, `APP_URL` and optionally the Resend and Telegram variables. The `vercel-build` script runs the migrations before each build. Run `npm run db:seed` once against the new database (with `SEED_ADMIN_PASSWORD` set) to create the campuses and the admin account.

## Not in version 1

As in the scope slide: no online rent payment and no digital contracts. Distances are straight lines; road distance (for example with OSRM) would be a good next step.
