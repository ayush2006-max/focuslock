# FocusLock

Local-first distraction blocking: a React dashboard + Chrome/Chromium Manifest V3 extension.
Choose exactly which websites distract you, choose how long you want to focus, and the
extension blocks those sites until your timer runs out. No backend, no accounts,
no browsing history — everything stays on your device.

> A normal web app cannot block other websites. The blocking is performed by the
> extension using only `declarativeNetRequest` rules — no content inspection,
> no tracking, only the domains you explicitly select.

## Structure

```
focuslock/
├── web/            React + TypeScript + Vite + Tailwind dashboard
├── extension/      Chrome Manifest V3 extension (TypeScript -> JS)
└── shared/         Types, domain presets + utilities shared by both
```

## 1. Run the dashboard

```bash
cd web
npm install
npm run dev            # http://localhost:5173  (port must stay fixed)
```

## 2. Build & load the extension

```bash
cd extension
npm install
npm run build          # outputs extension/dist
```

Then in Chrome/Chromium/Edge:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `extension/dist` folder

Keep the dashboard tab on `http://localhost:5173` — the extension's
connector script is injected there and carries messages to the service worker.

## 3. The important end-to-end test

1. Open the dashboard, pick **youtube.com** + **instagram.com** (chips or manual add).
2. Choose **30 minutes**, press **Start Focus**.
3. Visit `youtube.com` → you are redirected to the FocusLock blocked page with
   the remaining time (≈ `29:xx`).
4. Return to the dashboard → press **End Session** → confirm **End Early** →
   complete the randomized Escape Challenge (math / memory / typing / 30s wait).
5. The session ends and YouTube is accessible again.
6. Start another session and let the timer reach zero — the extension clears the
   rules automatically (alarm + timestamp check), the dashboard shows the
   completion screen, blocking stops.

The timer is timestamp-based (`sessionEndTime - now`), so it stays accurate if the
tab is throttled, minimized, or closed. The extension enforces the session
independently of the dashboard.

## Privacy

- Only the domains you select, session records, preferences and daily focus stats
  are stored locally (`chrome.storage.local` / `localStorage`).
- No browsing history, no page contents, no network traffic to any server.
- Extension permissions: `declarativeNetRequest` + `*://*/*` (host) so that any
  *user-chosen* site can be blocked; content script only talks to the dashboard.

## Safety valves

- **Escape Challenge** adds friction (not a lock) — always retriable.
- **Emergency Exit** in Settings and on the active-session screen immediately
  stops any session and re-enables every site.
