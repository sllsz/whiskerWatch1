# WhiskerWatch

A web app for cat owners to log daily behaviors (appetite, activity, litter box usage, mood) and analyze changes over time. The app helps identify unusual patterns by comparing daily logs to each cat's historical baseline using trend detection and rule-based analysis.

## Why?

Subtle behavioral changes in cats are often early signals of health issues. WhiskerWatch gives owners a structured, data-driven tool to notice these changes earlier — before they become emergencies.

## Features

- **Behavior Logging** — Rate appetite, activity, litter box, mood, and water intake on a 1–5 scale with intuitive sliders. Toggle symptoms like vomiting, sneezing, lethargy, and diarrhea. Log multiple times per day (like Apple Watch mood tracking).
- **Multi-Pet Profiles** — Create and manage multiple cat profiles. Switch between cats from any page with shared state across the app.
- **Interactive Analytics Dashboard** — View time-series trend charts (7-day rolling averages) with a radar chart showing period averages vs baseline. Toggle metrics on/off to compare. Scroll through time with daily/weekly/monthly/yearly views.
- **Wellness Score** — A composite 0–100 health score computed from recent metric averages, symptom frequency, and week-over-week trends.
- **Pattern-Based Warning System** — Detects baseline deviations, consecutive-day declines, week-over-week drops, and symptom frequency spikes. Warnings are classified by severity (high/medium).
- **Adaptive Baseline** — Each cat's "normal" is personalized using their full log history. The baseline adjusts automatically as more data is logged.
- **History & Filtering** — Browse and filter past logs by date range, metric type, score range, or symptom presence. Symptom history shows stacked bar chart broken down by individual symptom type. Paginated at 10 records per page.
- **Custom Symptoms** — Define up to 10 custom symptoms (e.g., "excessive grooming") that appear alongside the built-in ones in the log form.
- **Avatar Customization** — Customize each cat's profile picture by choosing fur color, ear shape, eye style, and pattern.
- **CSV Export** — Download your cat's log history as a CSV file for external analysis or vet visits.
- **Input Validation** — All forms validate inputs with clear error messages. The API validates all requests and returns structured error responses.

## Tech Stack

- **Frontend:** React 18, Vite, Recharts, React Router
- **Backend:** Node.js, Express
- **Database:** SQLite (via better-sqlite3)

## Setup & Running

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd final

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Seed Demo Data (Optional but Recommended)

Pre-populate the database with 4 cats and ~1500 logs covering 1 year of realistic behavioral data with seasonal variation and multi-entry days:

```bash
cd backend
npm run seed
```

This creates:
- **Mochi** (Scottish Fold) — Healthy veteran with 1 year of stable data
- **Luna** (Siamese) — Sensitive and stress-reactive, with spring allergies
- **Biscuit** (Orange Tabby) — Food-motivated with digestive issues
- **Pebble** (Senior) — Senior cat with gradual kidney disease decline

### Run the App

You need two terminal windows:

```bash
# Terminal 1 — Start the backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Start the frontend (port 5173)
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Troubleshooting

- **Blank page?** Make sure both the backend (port 3001) and frontend (port 5173) are running. The frontend proxies API requests to the backend.
- **"Network error" in the app?** The backend isn't running. Start it with `cd backend && npm run dev`.
- **Seed script fails?** Delete the database file first: `rm backend/whiskerwatch.db` then run `npm run seed` again.
- **Port already in use?** Kill existing processes: `lsof -ti:3001 | xargs kill` or `lsof -ti:5173 | xargs kill`

## Project Structure

```
final/
├── backend/
│   ├── server.js          # Express routes + middleware
│   ├── database.js        # SQLite schema & connection
│   ├── analytics.js       # Baseline, trends, health score, warnings
│   ├── validation.js      # Input validation for all API endpoints
│   ├── constants.js       # Shared metric/symptom definitions
│   ├── seed.js            # Demo data generator
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React entry point
│   │   ├── App.jsx              # Layout shell + routing
│   │   ├── App.css              # All styles (warm cat theme)
│   │   ├── api.js               # API client with error handling
│   │   ├── constants.js         # Shared metrics, colors, labels
│   │   ├── context/
│   │   │   └── CatContext.jsx   # Global state (cats, selection)
│   │   ├── hooks/
│   │   │   └── useAnalytics.js  # Dashboard data hooks
│   │   └── components/
│   │       ├── Dashboard.jsx    # Analytics charts & health score
│   │       ├── LogForm.jsx      # Behavior logging form
│   │       ├── History.jsx      # Log history, filters, pagination
│   │       ├── CatManager.jsx   # Add/edit/delete cat profiles
│   │       ├── CatSelector.jsx  # Cat dropdown in header
│   │       ├── Onboarding.jsx   # Welcome flow for new users
│   │       └── Icons.jsx        # SVG icon library + cat avatars
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── README.md
└── ARCHITECTURE.md              # Detailed code walkthrough
```

## No API Keys Required

This project runs entirely locally with SQLite — no external services or API keys needed.
