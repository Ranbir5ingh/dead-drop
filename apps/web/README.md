# Dead Drop web

Next.js 16 App Router PWA. Mobile-first scrapbook UI. GSAP for the hero, scroll entrances, card lifts, page transitions, and the verified-find burst.

## Run

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
npm install
npm run dev
```

Dev server: `http://127.0.0.1:4317`. It listens on every interface. `127.0.0.1` is listed in `allowedDevOrigins` so the browser can hydrate Hunt, Hide, and the board. Without that, those pages stay on the loading line.

The display name lives in `localStorage` (`deaddrop.displayName`). There is no auth. That is intentional for the demo and it is written on the hide form.

## Pages

| Path | What it asks you to do |
| --- | --- |
| `/` | Pick a side, then leave |
| `/hide` | Describe a real stash, confirm the riddle, go place it |
| `/hunt` | Choose one card. The list is capped. |
| `/drop/[id]` | Read the riddle, photograph the object |
| `/leaderboard` | See scores, then go hide something |

Camera input is `<input type="file" accept="image/*" capture="environment">`. Photos are resized in the browser before upload.

## Deploy

Vercel project, root directory `apps/web`. Set `NEXT_PUBLIC_API_URL` to the Render API origin. Add that Vercel URL to the API `FRONTEND_URL`.

PWA: `app/manifest.ts`, `theme-color` `#1b140f`, icons in `public/`. The service worker does not cache the board.

## Motion

GSAP and ScrollTrigger run only in the browser, and they stay off when `prefers-reduced-motion` is set. Animation never gates the hide, hunt, or verify actions.
