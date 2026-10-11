# Dead Drop web

Next.js 16 App Router PWA. Mobile-first scrapbook UI. GSAP for the hero, scroll entrances, card lifts, page transitions, and the verified-find burst.

## Run

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
npm install
npm run dev
```

Dev server: `http://127.0.0.1:4317`. It listens on every interface. `127.0.0.1` is listed in `allowedDevOrigins` so the browser can hydrate Hunt, Hide, and the board. Without that, those pages stay on the skeleton.

Sign-in is email and password, or Google and GitHub when the API has OAuth apps. The session cookie is httpOnly. Browser calls go to `/backend`, which this app proxies to `NEXT_PUBLIC_API_URL`, so the cookie stays on this origin. Hunt reads the device location and only lists drops within 8 km.

## Pages

| Path | What it asks you to do |
| --- | --- |
| `/` | Pick a side, then leave |
| `/hide` | Sign in, pick a real place, confirm the riddle, go place it |
| `/hunt` | Allow location. Choose one nearby card. |
| `/drop/[id]` | Read the riddle, photograph the object |
| `/login`, `/signup` | Open an account so scores have a name |
| `/leaderboard` | See account scores, then go hide something |

Camera input is `<input type="file" accept="image/*" capture="environment">`. Photos are resized in the browser before upload.

## Deploy

Vercel project, root directory `apps/web`. Set `NEXT_PUBLIC_API_URL` to the Render API origin. Add that Vercel URL to the API `FRONTEND_URL`.

PWA: `app/manifest.ts`, `theme-color` `#1b140f`, icons in `public/`. The service worker does not cache the board.

## Motion

GSAP and ScrollTrigger run only in the browser, and they stay off when `prefers-reduced-motion` is set. Animation never gates the hide, hunt, or verify actions.
