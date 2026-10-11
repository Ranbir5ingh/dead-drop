# Dead Drop

Humans hide real things for each other. AI only referees.

A hider stashes a small object outdoors, describes the vicinity, and the referee writes a riddle. A hunter reads the riddle, goes outside, and photographs the object. Vision verification decides the match. Both sides score. The exact spot is never published. The app never arranges a meeting.

This is a mobile-first PWA for the Hacktoberfest Week 1 "Touch Grass" DEV challenge.

```
Phone (mobile browser, nothing installed)
   │  HTTPS JSON
   ▼
Vercel  — Next.js UI, GSAP, camera
   │  NEXT_PUBLIC_API_URL
   ▼
Render  — NestJS API, the AI runtime
   ├── Supabase Postgres (Drizzle) — drops, finds, scores
   ├── Supabase Storage — drop-photos bucket
   └── Google AI Studio — Gemma, riddles + photo checks
```

The phone does not run a model. It calls the API. The API calls Gemma. Keys never reach the browser.

## Honesty about photos

The hosted demo sends find-photos, plus the private object description, from Render to **Google AI Studio** so Gemma can decide a match. Say that to anyone who plays it. Google's API terms apply to that hop. This project does not use those photos to train a model of its own.

The privacy-preserving alternative is local:

- `AI_PROVIDER=ollama` sends the photo bytes to Ollama on the machine running the API (`ollama pull gemma4:e4b`). They are not sent to Google.
- If `SUPABASE_URL` is unset and `NODE_ENV` is not `production`, photos are written to `apps/api/uploads` on that machine instead of Supabase. That folder is gitignored.
- Drop text still lives in Postgres. Point `DATABASE_URL` at a local database if the words should stay on the machine too.

Production (`NODE_ENV=production`) refuses to store photos anywhere except Supabase. There is no silent fallback that pretends a file was saved.

The mock referee (`AI_PROVIDER=mock`) exists so the UI can be built with no key. It writes a hand-made riddle and **always returns no match**. It cannot see photos and it will not invent one.

## Setup order

1. **Supabase.** Create a project. In `apps/api`, copy `.env.example` to `.env` and set the pooled `DATABASE_URL` (port 6543). Run `npm run db:push`. In Storage, create a public bucket named `drop-photos` (the API also tries to create it on first upload).
2. **Google AI Studio.** Create an API key. Set `GOOGLE_AI_API_KEY` and `AI_PROVIDER=google`.
3. **Env files.** `apps/api/.env` from `.env.example`. `apps/web/.env.local` with `NEXT_PUBLIC_API_URL`.
4. **Render.** New Blueprint from `render.yaml` (root directory `apps/api`). Set the secret env vars. Health check is `GET /health`.
5. **Vercel.** Import the same repo. Root directory `apps/web`. Set `NEXT_PUBLIC_API_URL` to the Render origin, with no trailing slash. Put that Vercel origin in the API's `FRONTEND_URL` (comma-separate a local origin if you need both).
6. **Local AI, optional.** Install [Ollama](https://ollama.com), run `ollama pull gemma4:e4b`, set `AI_PROVIDER=ollama` and `OLLAMA_URL` (default `http://127.0.0.1:11434`).

Then seed sample riddles so Hunt is not empty:

```bash
npm run seed
```

Those three drops are flagged `seeded`. They show a sample stamp. They cannot be scored, because nothing was physically hidden.

## Local dev

```bash
npm install --prefix packages/shared && npm run build --prefix packages/shared
npm install --prefix apps/api && npm install --prefix apps/web
# apps/api/.env and apps/web/.env.local
npm run dev:api    # http://127.0.0.1:8787
npm run dev:web    # http://127.0.0.1:4317
```

Accounts are email and password, plus Google and GitHub when `GOOGLE_OAUTH_*` and `GITHUB_OAUTH_*` are set. Passwords are scrypt hashes. Passport checks a 15-minute JWT access cookie (`dd_access`) on hunt, hide, places, finds, and the leaderboard. A rotating refresh cookie (`dd_refresh`, 30 days, stored only as a SHA-256 hash) issues a new access token on each page load. Both cookies are httpOnly and SameSite=Lax. The browser talks to `/backend` on the site so they stay first-party. Set `API_PUBLIC_URL` to that public prefix (for example `https://your-app.vercel.app/backend`) and set `JWT_SECRET`. Hide, hunt, and the leaderboard redirect to login until a refresh cookie is present.

## How a round works

1. **Hide** (`/hide`) requires a session. The hider picks a real place (`GET /api/places`), then posts the vicinity, the object, that place id, and an optional vicinity photo to `POST /api/drops`. Coordinates are stored on the drop and are not returned. The drop is `preview` until confirmed.
2. The hider reads the riddle. **Confirm** calls `POST /api/drops/:id/publish`. **Write a different one** calls `DELETE /api/drops/:id`.
3. **Hunt** (`/hunt`) reads this device's location in the browser and calls `GET /api/drops?lat=&lng=`. The API returns at most 40 open drops within 8 km, closest first, with `distanceMeters` only. No coordinates, no object answers, no vicinity text. The device reading is not stored. Sample drops without a place do not appear.
4. **The riddle** (`/drop/[id]`) accepts up to 3 photos per finder. A verified find awards `10 × difficulty` to the hunter and `5 × difficulty` to the hider. The hider sees "Your drop was found" the next time they open the app. There are no push notifications.
5. **Board** (`/leaderboard`) ranks real hiders and hunters. Seeded drops are excluded.

A model "yes" below confidence 0.72 is forced to no. If the referee is down or returns junk, the look is **not** counted.

## Safety, in code

The model does not get the last word.

- Riddles are scanned for addresses, phone numbers, coordinates, plus codes, what3words, URLs, and emails. A hit is rejected and regenerated, twice. Then a hand-written template is used, and that template is scanned too.
- A riddle that copies the object description is rejected.
- Area names that look like an address, phone number, or coordinate are rejected at the door.
- Prompts contain the drop description only. Display names are not sent to the model.
- Photos must sniff as JPEG, PNG, or WebP and be 5 MB or smaller. The browser resizes the long edge to 1600px before upload.
- Find photos and vicinity photos are not rendered on the public board.

**Retention.** Photos stay in the `drop-photos` bucket (or `apps/api/uploads` on a local API) until an operator deletes them. This demo does not auto-expire files. Bucket URLs are unlisted but the bucket is public: anyone with the URL can open the file. Paths are UUIDs. The UI does not publish them.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | `{ ok: true }` for Render |
| POST | `/api/drops` | multipart create, returns a preview riddle |
| POST | `/api/drops/:id/publish` | hider confirms, drop goes live |
| DELETE | `/api/drops/:id?hiderName=` | discard a preview |
| GET | `/api/drops` | board, no answers |
| GET | `/api/drops/:id` | full riddle and public meta |
| GET | `/api/drops/by-hider/:name` | the hider's "you were found" check |
| POST | `/api/drops/:id/finds` | multipart photo, verification |
| GET | `/api/leaderboard` | hiders and hunters |

CORS allows only `FRONTEND_URL`.

## Models and licenses

- **Production referee:** Gemma via the Gemini API, `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`. The provider tries `gemma-3-12b-instruct`, then `gemma-3-12b-it`. If both return 404, it uses `gemma-4-26b-a4b-it`, which is the Gemma model current AI Studio keys expose. Text in, text out for riddles. Text plus a base64 image for verification.
- **Local referee:** Ollama model tag `gemma4:e4b`, as set for this challenge. `POST $OLLAMA_URL/api/chat`.
- **Gemma terms:** weights are released under the [Gemma Terms of Use](https://ai.google.dev/gemma/terms), not an OSI license. Serving Gemma through Google AI Studio is allowed for the "Best Use of Gemma" category.
- **This repo:** MIT. See `LICENSE`. NestJS, Next.js, Drizzle, and Postgres are the open stack around the model.

`class-transformer` ships with Nest's `ValidationPipe`. The `postgres` package is the Drizzle driver, with `prepare: false` so the Supabase pooler (PgBouncer) does not break on prepared statements.

## Why open innovation matters

The game only works if the referee can be replaced.

The hosted path is there so a person with a phone and no toolchain can play: Vercel paints the scrapbook, Render holds the key, Google runs Gemma. That is a convenience, and it has a cost: a find-photo leaves the device. The same `AiService` will talk to Ollama instead, with no change to the hunt, the scores, or the safety scanner. Open weights are what make that swap real. A closed referee would decide the match in a place nobody else can run, and the scores would be a story you have to take on trust.

The rest of the trust is ordinary open infrastructure. Postgres is the shared board, so two strangers do not need a peer-to-peer sync story. The safety checks that reject an address in a riddle are plain TypeScript, reviewed in this repo, and they override the model. The mock provider refuses to counterfeit a match, which is the same rule a local model is held to: uncertainty is a no.

Open here does not mean "the photo is free for anyone to train on." It means the rules are readable, the model can run on a machine you control, and the hosted demo tells you plainly when it does not.

## Prize categories

This submission is entered for:

- **Best Use of Gemma** — Gemma writes the riddle and judges the find-photo. Production uses the Google AI Studio API. Local uses Ollama. The category allows serving through a provider.
- **Best Use of Render** — the NestJS API, which is the AI runtime, is a Render web service (`render.yaml`).
- **Overall** — every submission is in the running.

No other prize categories are claimed.

## Scripts

| Command | Where |
| --- | --- |
| `npm run dev:api` / `npm run dev:web` | local servers |
| `npm test` | safety, parsing, and scoring tests |
| `npm run db:push` | push the Drizzle schema |
| `npm run seed` | three sample drops |
