# WhiskerWatch — Architecture & Code Walkthrough

This document explains how the codebase is organized, what each file does, and how data flows through the system. Read this if you want to understand the code without reading every file.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React)                   │
│                                                     │
│  Onboarding ──► App Shell ──► Dashboard / Log /     │
│                    │           History / CatManager  │
│                    │                                 │
│              CatContext (global state)               │
│                    │                                 │
│              api.js (fetch wrapper)                  │
└────────────────────┬────────────────────────────────┘
                     │  HTTP (proxied via Vite)
                     ▼
┌─────────────────────────────────────────────────────┐
│                Backend (Express)                     │
│                                                     │
│  server.js ──► validation.js (input checks)         │
│            ──► database.js   (SQLite queries)        │
│            ──► analytics.js  (trend/warning engine)  │
│                                                     │
│  constants.js (shared metric/symptom definitions)    │
└─────────────────────────────────────────────────────┘
```

---

## Backend

### `database.js` — Schema & Connection

Creates and exports a single SQLite connection. On first run, it creates four tables:

- **`cats`** — id, name, breed, birth_date, weight, avatar preferences (color, ear, eye, pattern)
- **`daily_logs`** — id, cat_id (FK), date, 5 metric scores (1–5), 4 symptom flags (0/1), notes. Has a UNIQUE constraint on `(cat_id, date)` so each cat can only have one log per day.
- **`custom_symptoms`** — id, name (unique). Global symptom definitions created by the user (max 10).
- **`log_custom_symptoms`** — log_id, symptom_id (composite PK). Links custom symptoms to specific log entries.

### `constants.js` — Shared Definitions

Single source of truth for:
- `METRICS` — the 5 behavioral metrics: appetite, activity, litter_box, mood, water_intake
- `SYMPTOMS` — the 4 symptom flags: vomiting, sneezing, lethargy, diarrhea
- `formatMetric()` — converts `litter_box` → `Litter Box`
- `countSymptoms()` — sums symptom flags for a log row

Both the analytics engine and validation module import from here.

### `validation.js` — Input Validation

Three validators used by route handlers:
- `validateIntParam(raw, name)` — checks URL params like `:catId` are positive integers
- `validateCatBody(body)` — validates/sanitizes cat profile fields (name required, ≤30 chars, weight 0–50, etc.)
- `validateLogBody(body)` — validates date format (YYYY-MM-DD), clamps metrics to 1–5, coerces symptom flags to 0/1

Each returns `{ valid: true, data }` or `{ valid: false, error }`.

### `analytics.js` — The Analytics Engine

Pure functions (no database or HTTP awareness). The route handler fetches all logs for a cat and passes them in.

**`computeAnalytics(logs)`** returns:

| Field | What it is |
|---|---|
| `baseline` | All-time average for each metric. Adapts as more data arrives. |
| `baselineStdDev` | Standard deviation per metric. Used to show "usual range" in the UI. |
| `trends` | One data point per day with raw scores + 7-day rolling averages. Powers the trend charts. |
| `recentAvg` | Average of each metric over the last 7 days. Compared against baseline. |
| `healthScore` | Composite 0–100 score from three components (see below). |
| `warnings` | Array of `{ type, metric, severity, message }` objects. |
| `stats` | `{ totalLogs, totalSymptoms, daysCovered, streakDays }` |

**Health Score (0–100) has three components:**
1. **Recent metric averages (up to 80 pts)** — each metric contributes `(score/5) × 16`
2. **Symptom penalty (up to −15 pts)** — each symptom in the past week costs 4 pts
3. **Trend bonus/penalty (±15 pts)** — compares this week's avg to last week's

**Warning rules:**
- `decline` — recent 7-day avg dropped >15% below all-time baseline
- `trend` — 3+ consecutive days of declining scores
- `week_decline` — this week's avg dropped >0.8 points from last week
- `symptoms` — 3+ symptom occurrences in the past 7 days
- `low_score` — most recent log scored ≤2 on any metric

All thresholds are named constants at the top of the file.

### `server.js` — Routes & Middleware

Handles HTTP only — no business logic. Structure:

1. **Request logging middleware** — logs every request with timestamp, method, path, status, duration
2. **Cat CRUD** — GET/POST/PUT/DELETE `/api/cats` with validation and 404 checks
3. **Log CRUD** — GET/POST/PUT/DELETE `/api/cats/:catId/logs` with validation. POST handles the UNIQUE constraint conflict by returning 409 (the frontend retries as PUT).
4. **Avatar** — PUT `/api/cats/:id/avatar` saves avatar customization preferences
5. **Custom Symptoms** — GET/POST/DELETE `/api/custom-symptoms` manages global custom symptom definitions (max 10). GET/PUT `/api/cats/:catId/logs/:date/custom-symptoms` attaches custom symptoms to log entries.
6. **Analytics** — GET `/api/cats/:catId/analytics` fetches all logs and delegates to `computeAnalytics()`
7. **Global error handler** — catches unhandled exceptions, logs them, returns `{ error: "Internal server error" }` instead of stack traces

---

## Frontend

### `api.js` — API Client

Single function `apiFetch(path, options)` that wraps `fetch()`. Every call returns:
- `{ ok: true, data }` on success
- `{ ok: false, error: "...", status: 404 }` on failure

Handles network errors, non-2xx responses, and JSON parse failures. All components use this instead of raw `fetch()`.

### `constants.js` — Shared Definitions

Frontend mirror of the backend constants:
- `METRICS`, `SYMPTOMS` — same arrays as backend
- `METRIC_COLORS` — chart colors per metric (visually distinct)
- `METRIC_LABELS` — human-readable labels for scores 1–5 (e.g., appetite 1 = "Not eating")

### `context/CatContext.jsx` — Global State

React Context that manages:
- `cats` — list of all cat profiles
- `selectedCatId` / `selectedCat` — the currently active cat
- `loading` / `error` — initial fetch state
- `addCat()`, `updateCat()`, `deleteCat()` — CRUD operations

Key design decisions:
- Adding a new cat does NOT auto-switch to it (except the very first cat during onboarding)
- `deleteCat()` uses a `setCats` callback to avoid stale-closure bugs when picking a fallback cat
- `fetchCats()` is stable (no deps that change) so it doesn't re-fetch when you switch cats

### `hooks/useAnalytics.js` — Dashboard Data Logic

Extracted from Dashboard.jsx to keep rendering separate from data transformation.

- **`useAnalyticsData(catId)`** — fetches analytics and manages loading/error state
- **`useTrendData(analytics, view, offset)`** — windows and aggregates trend data by daily/weekly/monthly view with pagination
- **`useBarData(analytics, offset)`** — windows daily score data with pagination
- **`getHealthLabel(score)`** / **`getHealthColor(score)`** — maps score to display label and color

### Components

| Component | What it does |
|---|---|
| **`App.jsx`** | Layout shell. Shows loading screen → error screen → onboarding (if no cats) → main app with header, nav, routes, footer. |
| **`Onboarding.jsx`** | Welcome screen with feature overview and a form to create the first cat. Only shown when `cats.length === 0`. |
| **`Dashboard.jsx`** | The main analytics page. Renders: health score ring, quick stats, warning alerts, baseline comparison cards, trend line chart, daily bar chart, symptom area chart. All chart data comes from `useAnalytics` hooks. |
| **`LogForm.jsx`** | Daily log entry form. Sliders for 5 metrics (1–5), toggle buttons for built-in + custom symptoms, date picker, notes field. On submit: POST to create, auto-retries as PUT if a log already exists for that date. |
| **`History.jsx`** | Log history with collapsible filter panel (date range, metric selection, score range, symptoms-only toggle). Paginated at 10 per page. CSV export button. |
| **`CatManager.jsx`** | Cat profile CRUD with avatar customizer and custom symptom management. Shows all cats with their avatars. Add/edit/delete with validation. |
| **`CatSelector.jsx`** | Dropdown in the header to switch between cats. Shows the selected cat's generated avatar. |
| **`Icons.jsx`** | SVG line art icon library (cat face, paw, bowl, stethoscope, etc.) plus `CatAvatar` — a customizable cat face SVG. Uses stored avatar preferences if set, otherwise procedurally generates from the cat's name. |

---

## Data Flow: Logging → Analytics → Warnings

```
User fills out LogForm
        │
        ▼
POST /api/cats/:id/logs  (validated by validation.js)
        │
        ▼
Saved to daily_logs table in SQLite
        │
        ▼
User navigates to Dashboard
        │
        ▼
GET /api/cats/:id/analytics
        │
        ▼
analytics.js loads ALL logs for this cat, computes:
  ├── baseline (all-time averages)
  ├── trends (daily scores + 7-day rolling averages)
  ├── healthScore (composite 0–100)
  ├── warnings (rule-based alerts)
  └── stats (totals and streak)
        │
        ▼
Dashboard renders charts, score ring, and warning cards
```

---

## Complexity Markers (for grading reference)

1. **Multiple pages/components with shared state** — 4 pages sharing `CatContext` for selected cat
2. **Persistent data** — SQLite database survives restarts
3. **Non-trivial logic/data processing** — analytics engine with rolling averages, baseline modeling, composite health scoring, rule-based warning system with 5 warning types
4. **Responsive, thoughtful UX** — warm cat-themed design, SVG artwork, form validation, error/loading/empty states, pagination, scrollable charts with daily/weekly/monthly views
