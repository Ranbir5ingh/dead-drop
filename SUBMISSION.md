# Dead Drop — Hacktoberfest Week 1, Touch Grass

## What I Built

Dead Drop is a mobile hide-and-seek game where people stash small real objects for each other and an AI only referees.

A hider describes a vicinity and an object. Gemma writes a cryptic riddle and is forbidden from naming the spot. Hunters browse riddles, go outside, and photograph what they find. Gemma vision decides whether the photo shows the object. A match scores both people: the hunter gets 10 × difficulty, the hider gets 5 × difficulty. The hider's "your drop was found" moment shows the next time they open the app. There is no notification stream and no streak to lose.

It is not a list of AI errands. The other player is a person. The model is the strict, slightly humorless judge.

The phone is a PWA. Nothing is installed and no model runs on it. The Next.js app on Vercel calls a NestJS API on Render. Render talks to Supabase Postgres, Supabase Storage, and the Google AI Studio Gemma API. The same API can point at Ollama (`gemma4:e4b`) so the referee stays on one machine.

## Demo

- Web (Vercel): set this to the deployed `apps/web` URL after import.
- API (Render): set this to the deployed service URL. Health check: `GET /health` → `{ "ok": true }`.

Play it on a phone, in a public place you are allowed to be:

1. Hide — broad area, vicinity, secret object description. Confirm the riddle. Go put the object down.
2. Hunt — open a riddle on another phone (or another browser profile). The board has no coordinates.
3. Photograph the object. A match updates both scores. A couch photo should fail. The mock referee, if you ever point the API at it, fails every photo on purpose.
4. Open the app again as the hider. The found moment is waiting. The leaderboard is the souvenir, not the game.

Sample riddles ship from `apps/api/scripts/seed.mjs` so a fresh board is not blank. They are stamped as samples and cannot be scored.

**Photos on the hosted demo are sent to Google AI Studio.** The README says the same thing. Local Ollama does not send them to Google.

## Code

This repository.

- `apps/web` — Next.js 16, Tailwind, GSAP, PWA, camera.
- `apps/api` — NestJS 11, Drizzle, Supabase, the three referees.
- `packages/shared` — the response shapes and the scoring rules.
- `render.yaml` — Render Blueprint for the API.

## How I Built It

The board is relational on purpose. A drop has many find attempts, a leaderboard is a join and a group, and a score is a row you can audit. Drizzle talks to Supabase Postgres through the pooled connection with prepared statements disabled. Photos go up with multer memory storage and the service-role key, which never ships to the browser.

`AiService` is provider-neutral. `generateRiddle` and `verifyFind` validate JSON, retry twice, and then either fall back to a hand-written riddle or refuse to score. A deterministic scanner rejects addresses, phone numbers, coordinates, plus codes, and lookalike links before a riddle is shown. A yes below confidence 0.72 becomes a no in code. The model cannot overrule that. If the referee errors, the attempt is not burned.

The UI is a paper scrapbook: Space Grotesk, Caveat, stamp badges, sticker cards, contour texture, chunky buttons. GSAP staggers the hero, floats the map pins, reveals the three steps on scroll, lifts a card under a pointer, and bursts when a find is verified. Every page ends by telling you to go outside. The hunt is capped at 40 cards. There is no infinite scroll.

Identity is a display name in localStorage. No accounts, and the hide form says so.

## Why Open Innovation Matters

A referee you cannot run is a referee you have to trust blindly, and this game's only product is that the score is honest.

Gemma's weights can be served by Google AI Studio for a person who will not install anything, and the same service can call Ollama on a laptop when the photo should not leave the machine. That swap is the open part. The hosted demo is allowed to be easy, and it is required to say that find-photos go to Google. The local path is the one where they do not.

The rules that make a match mean something are not inside the model. They are in this repo: the scanner, the confidence floor, the three-attempt cap, the refusal to score a sample riddle, the refusal of the mock provider to invent a yes. Postgres is the shared world, so two hunters are looking at the same drop without a sync protocol. Open infrastructure is what lets the humans be the game and the model be the referee.

## Prize Categories

- **Best Use of Gemma ($200 featured).** Gemma generates every live riddle and verifies every find-photo. Production calls the Google AI Studio API (`gemma-3-12b-instruct`, then `gemma-3-12b-it`, then `gemma-4-26b-a4b-it` when the older ids are not on the key). Local dev calls Ollama (`gemma4:e4b`). The category allows serving Gemma through a provider. Safety checks in our code can reject the model's riddle or its yes.
- **Best Use of Render ($200 featured).** The NestJS API is the AI runtime and it is a Render web service, described in `render.yaml`: build `npm install && npm run build`, start `node dist/main`, health check `/health`.
- **Overall ($250).** The submission is in the running with everyone else.

No other categories are claimed.
