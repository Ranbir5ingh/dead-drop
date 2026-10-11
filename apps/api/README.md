# Dead Drop API

NestJS 11 service. Global prefix `/api`, plus `GET /health` for Render. This process is the AI runtime: the phone never calls Gemma itself.

## Run

```bash
cp .env.example .env
# from the repo root, once:
npm run build --prefix ../../packages/shared
npm install
npm run db:push
npm run seed
npm run dev
```

Listens on `0.0.0.0` and `PORT` (default `8787`).

`AI_PROVIDER` is `google`, `ollama`, or `mock`.

- `google` requires `GOOGLE_AI_API_KEY`. Riddles and find-photos go to Google AI Studio.
- `ollama` posts to `OLLAMA_URL` (default `http://127.0.0.1:11434`) with model `gemma4:e4b`. Photos are not sent to Google. You need `ollama pull gemma4:e4b`.
- `mock` returns a hand-written riddle and never a photo match.

## Database and photos

Schema: `src/db/schema.ts`. Apply it with `npm run db:push` against the Supabase pooled `DATABASE_URL`. The client sets `prepare: false` for PgBouncer.

Create a public Storage bucket named `drop-photos`. Uploads use the service-role key and multer memory storage. The key stays in this process.

In production, a missing Supabase config fails the upload. Outside production, photos land in `uploads/` so a laptop can run without the bucket. See the root README for retention and the Google hop.

## Deploy

`render.yaml` at the repo root is the Blueprint. Root directory `apps/api`. Build `npm install && npm run build`. Start `node dist/main`. Health check `/health`.

Set `FRONTEND_URL` to the Vercel origin before real browsers can call the API. CORS rejects every other origin.

## Tests

```bash
npm test
```

Covers the riddle scanner, JSON parsers, the address-safe fallback, name matching, and the 10× / 5× scores.
