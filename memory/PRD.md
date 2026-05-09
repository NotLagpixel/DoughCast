# DoughCast — Donut Probability App (PRD)

## Original Problem Statement
> Create a donut probability application where it predicts the amount of donuts a baker should make the next day based off of data with user authentication. Include main dashboard, navbar, and use a clean, professional design. Make it mobile responsive and don't build any functionality yet. Only create the sections and placeholders.

## Architecture
- Frontend: React 19 + React Router 7 + Tailwind CSS + Shadcn UI
- Backend: FastAPI + MongoDB (template, untouched in v0.1)
- Brand: "DoughCast" — earthy warm bakery palette (#FDFBF7 / #3E2723 / #D95A4E / #E8A365)
- Typography: Outfit (display) + Manrope (body) + JetBrains Mono (numerics)

## User Personas
- Solo bakery owner planning daily batch sizes
- Small bakery manager tracking waste & stockouts
- Multi-location operator wanting per-flavor forecasts

## Core Requirements (static)
- Auth (login + signup screens)
- Sticky responsive navbar (marketing + app variants)
- Main dashboard: tomorrow's prediction, flavor breakdown, KPI stats, sales trend chart, recent batches table, settings
- Mobile responsive (sm/md/lg breakpoints)
- Clean professional design, distinctive (not generic SaaS)

## Implemented (2026-02 — v0.6 PWA / installable app)
- `manifest.json` with brand name, theme color (#D95A4E), portrait standalone display, app shortcuts
- App icons: 192px, 512px, 512px maskable, 180px Apple touch icon, 64px favicon (auto-generated donut design)
- `sw.js` service worker — caches the app shell, passes through `/api/*`, registers only in production builds
- Page title now "DoughCast — Mochi Donut Forecasting"; viewport-fit=cover for iOS notch
- `<InstallPrompt>` component listens for `beforeinstallprompt` and shows a dismissable "Install DoughCast" toast (re-shows after 7 days if dismissed)
- iOS users still install via Safari Share → Add to Home Screen (apple-mobile-web-app-* meta tags configured)

## Implemented (2026-02 — v0.5 Account page + Mobile preview)
- Account moved to its own page at `/account` (ProtectedRoute) reachable from navbar dropdown "Profile & Settings"
- Mobile-only sticky bottom nav (Home / + Log / Account) on Dashboard and Account pages
- Marketing landing now has a "Built to live in your apron pocket" section with a phone-frame mockup showing the dashboard mini-preview
- Settings card header now shows quick "Manage profile & password →" link to /account
- Tabs removed from settings card (Bakery is now full-width)

## Implemented (2026-02 — v0.4 account & closed days)
- Account tab inside settings card (Tabs: Bakery | Account)
- Profile picture upload (canvas-resized to 256px, JPEG, base64-stored)
- Editable bakery name + email (with duplicate-email protection) and password change form
- Closed-days picker — toggle Mon-Sun; forecast still returns prediction with `is_closed`/`closed_reason` flags + UI badge "Typically closed on [Day]s" with muted hero
- JWT TTL extended from 7 → 30 days; users stay signed in across reloads (token in localStorage)

## Implemented (2026-02 — v0.3 auto-save + mochi rebrand)
- Mochi donut copy throughout (hero, dashboard, flavors)
- Default flavors: Matcha, Ube, Strawberry, Black Sesame, Mango, Classic Glaze
- Auto-save settings with 650ms debounce + "Saving…/All saved" indicator
- Real-time refresh of forecast & stats on settings change and tab focus
- Public route guard: authenticated users can't visit `/`, `/login`, `/signup` (redirect to `/dashboard`)

## Implemented (2026-02 — v0.2 full functionality)
- Landing page with hero, features grid, how-it-works, pricing CTA
- Login page (split-screen with bakery imagery)
- Signup page (split-screen with perks)
- Dashboard: prediction hero card, flavor mix bars, 4 KPI stats, sales trend chart placeholder, bakery settings card, recent batches table
- Navbar (marketing + app variants) with mobile drawer
- Footer with product/company links
- All interactive elements have data-testid attributes
- Custom theme tokens (CSS variables) replacing default shadcn gray with earthy palette

## Not Yet Implemented (placeholder only)
- All form submissions are no-ops (preventDefault)
- No real backend auth, JWT, sessions
- Chart is a faux visual; no recharts integration yet
- No data persistence; static demo numbers

## Prioritized Backlog
### P0 (next)
- JWT-based auth backend (register/login/logout, password hashing via integration playbook)
- Wire login + signup forms to backend
- Protected /dashboard route + auth context

### P1
- Sales/batch logging API (POST /api/batches)
- Real recharts line chart for 14-day sold vs baked vs predicted
- Forecast endpoint with simple moving-average baseline

### P2
- Weather data integration for forecast adjustment
- Holiday/calendar awareness
- Per-flavor forecasting model
- Multi-bakery support
- CSV export of historical data

## Files
- /app/frontend/src/App.js — router
- /app/frontend/src/index.css — theme + fonts
- /app/frontend/src/components/Navbar.jsx
- /app/frontend/src/components/Footer.jsx
- /app/frontend/src/pages/Landing.jsx
- /app/frontend/src/pages/Login.jsx
- /app/frontend/src/pages/Signup.jsx
- /app/frontend/src/pages/Dashboard.jsx
- /app/design_guidelines.json — design source of truth
