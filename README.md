# Strength Start

A small installable web app (PWA) for a beginner home strength program: short Monday-to-Friday sessions,
12 levels, rest and hold timers, a guided warm-up and cool-down, water tracking, and push reminders.
Everything is stored on the phone; it works offline once opened.

There is no build step. The files in this repo are served as they are (e.g. by GitHub Pages).

## Running it locally

Serve the folder with any static server and open it in the browser:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Service workers (offline use, reminders) only run on `http://localhost` or HTTPS.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | The page shell and all styling |
| `js/data.js` | The program: exercises, levels, easier swaps, warm-up and cool-down. **Edit this to change the training.** |
| `js/plan.js` | Training logic: today's exercises, session length, streak, level review |
| `js/state.js` | What the app remembers (localStorage) |
| `js/main.js` | Entry point: draws the current tab and handles taps and settings |
| `js/views/*.js` | The Today, Plan and Settings tabs |
| `js/timer.js` | Countdown panel: rest between sets, the move to the next exercise, holds and routines |
| `js/awake.js` | Keeps the screen on during a workout |
| `js/video.js`, `js/media.js` | In-app video player; demo images that fail to load |
| `js/push.js`, `js/config.js` | Reminder subscription and the reminder server's address |
| `sw.js` | Service worker: offline cache, updates, showing reminders |

## Releasing a change

1. Bump `CACHE` in `sw.js` (e.g. `ss-v9` → `ss-v10`). Phones only pick up a new version when this changes;
   they then show a "new version is ready" banner.
2. If you added a file, add it to `FILES` in `sw.js` as well.
3. Run the tests: `npm test` (needs Node 20 or newer; nothing to install).

## Reminders

Reminders are sent by a separate Web Push server (a Cloudflare Worker, not in this repo).
`js/config.js` holds its address (`PUSH_URL`) and its VAPID **public** key. The private key belongs only on the server.

The app talks to the server with three JSON `POST` requests, each including the phone's random `id`:

| Path | Body | Purpose |
| --- | --- | --- |
| `/sync` | `sub`, `tz`, `reminders`, `done` | Save the push subscription, time zone and schedule (see `buildReminders` in `js/push.js`). Sent only when something changed. |
| `/test` | | Send a test reminder now |
| `/remove` | | Forget this phone |

`done` lists today's reminders to skip: water once the goal is reached, workout once the day is marked complete.
Errors come back as `{ "error": "message" }`, which the app shows to the user.
