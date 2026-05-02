# EcoManage — CBRE Intelligent Building Sustainability Platform

> **HackUTD 2024 — CBRE Challenge Submission**
> Built by Ubaid & Christina at [Dyne Labs](https://www.dynelabs.org)
> Live at **[ecomanage.dynelabs.org](https://ecomanage.dynelabs.org)**

---

## The Challenge

CBRE — the world's largest commercial real estate services firm — presented the following challenge at HackUTD 2024:

> **"Build a technology solution that helps CBRE property managers monitor, analyze, and optimize the sustainability performance of their building portfolio."**

---

## The Solution: EcoManage

EcoManage is a full-stack sustainability intelligence platform that gives CBRE property managers a live, portfolio-wide view of building performance — with a focus on actionable insights over raw data.

### Core Features

- **EcoScore™** — Composite 0–100 sustainability rating (A–F) from energy, HVAC, temperature & waste
- **Carbon Footprint Tracking** — Real-time CO₂e using EPA conversion factors
- **7-Day Predictive Forecast** — Linear regression projections for energy & waste
- **Smart Alerts** — Automated threshold breach detection per building
- **AI Recommendations** — Context-aware suggestions from 7-day rolling averages
- **Business Impact Row** — Daily cost, monthly projections, carbon tree offsets, ESG status
- **Portfolio Overview** — Visual grid of all properties with color-coded EcoScore badges

---

## Tech Stack

| Layer            | Replit / Local            | Netlify + Supabase                       |
|------------------|---------------------------|------------------------------------------|
| Frontend         | Flask (serves templates)  | Static HTML/CSS/JS on Netlify CDN        |
| Backend / API    | Python Flask + Gunicorn   | Netlify Serverless Functions (JS)        |
| Database         | PostgreSQL (built-in)     | Supabase PostgreSQL (free tier)          |
| ORM / DB client  | Flask-SQLAlchemy          | @supabase/supabase-js                    |
| Charts           | Chart.js 4.x              | Chart.js 4.x (unchanged)                |

---

## Project Structure

```
ecomanage/
├── version1.2/
│   ├── app.py                  # Flask app — routes, API, EcoScore engine, seed
│   ├── models.py               # SQLAlchemy models (Building, DailyData)
│   ├── requirements.txt        # Python dependencies
│   ├── templates/              # HTML pages (zero Jinja2 vars — pure static HTML)
│   │   ├── landing.html        #   /           → public landing page
│   │   ├── index.html          #   /dashboard  → main dashboard
│   │   ├── login.html          #   /login      → sign-in
│   │   └── manage.html         #   /manage     → building manager
│   └── static/
│       ├── main.css            # CBRE-branded design system
│       ├── dashboard.js        # Dashboard logic + Chart.js + EcoScore gauge
│       ├── manage.js           # Building management page logic
│       └── images/             # Building photography + logos
│
├── netlify/
│   └── functions/
│       └── api.js              # Serverless function — all API routes in one file
│                               # Business logic ported 1-to-1 from app.py
│
├── supabase/
│   └── schema.sql              # Run once in Supabase SQL Editor to create tables
│
├── scripts/
│   ├── build-netlify.sh        # Copies templates+static → dist/ for Netlify
│   ├── seed-supabase.js        # Seeds 5 demo buildings + 90 days of data
│   └── post-merge.sh           # Replit post-merge hook
│
├── netlify.toml                # Netlify build config + redirect rules
├── package.json                # Node deps for Netlify Function (@supabase/supabase-js)
├── Procfile                    # Gunicorn start (Heroku / Railway compatible)
├── render.yaml                 # Render.com config (optional alternative to Netlify)
├── runtime.txt                 # Python 3.12 version pin
└── .env.example                # Environment variable reference
```

---

## Environment Variables

| Variable                   | Used by                  | Where to get it                                              |
|----------------------------|--------------------------|--------------------------------------------------------------|
| `DATABASE_URL`             | Flask (Replit / local)   | Replit: auto-injected. Supabase: Settings → Database → URI  |
| `SUPABASE_URL`             | Netlify Function         | Supabase: Settings → API → Project URL                      |
| `SUPABASE_SERVICE_ROLE_KEY`| Netlify Function         | Supabase: Settings → API → service_role key (keep secret)   |

> **Replit**: `DATABASE_URL` is injected automatically — nothing to configure.

---

## Deployment Options

### Option 1 — Replit (current live deployment)

No changes needed. The Flask app runs as-is.

- **Dev**: `cd version1.2 && python app.py`
- **Production**: Gunicorn via `.replit` deploy config
- **Database**: Replit built-in PostgreSQL (auto-configured)
- **Live**: [ecomanage.dynelabs.org](https://ecomanage.dynelabs.org)

---

### Option 2 — Local Development

**Prerequisites**: Python 3.10+, PostgreSQL (local or Supabase)

```bash
# 1. Clone
git clone <your-repo-url>

# 2. Install Python dependencies
pip install -r version1.2/requirements.txt

# 3. Set database URL (choose one)
export DATABASE_URL=postgresql://postgres:password@localhost:5432/ecomanage
# or Supabase:
export DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# 4. Run
cd version1.2
python app.py
```

Open [http://localhost:5000](http://localhost:5000). On first run the app creates tables and seeds 5 demo buildings automatically.

---

### Option 3 — Netlify + Supabase (free, no server required)

This is the recommended free deployment. Everything runs at $0/month.

```
Browser
  ↓  static assets (CDN)
Netlify
  ↓  /api/*, /buildings, /data/* (serverless function)
netlify/functions/api.js
  ↓  SQL queries
Supabase PostgreSQL
```

#### Step 1 — Set up Supabase

1. Sign up at [supabase.com](https://supabase.com) → **New project** (pick a region close to you)
2. Wait ~2 min for provisioning
3. Go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and click **Run**
4. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **service_role** key (under "Project API keys" — the secret one)

#### Step 2 — Seed demo data

Run once from your local machine with Node.js 18+:

```bash
npm install   # installs @supabase/supabase-js

SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node scripts/seed-supabase.js
```

This seeds 5 buildings with 90 days of realistic data. Use `--force` to wipe and re-seed.

#### Step 3 — Deploy to Netlify

1. Sign up at [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Connect your GitHub/GitLab repo
3. Netlify detects `netlify.toml` automatically. Build settings:
   - **Build command**: `bash scripts/build-netlify.sh`
   - **Publish directory**: `dist`
4. Under **Site → Environment variables**, add:
   ```
   SUPABASE_URL              = https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
   ```
5. Click **Deploy site** — done in ~60 seconds

Netlify's `[[redirects]]` in `netlify.toml` automatically route all API calls to `netlify/functions/api.js`. The frontend JavaScript requires zero changes — it still uses relative URLs (`/api/summary/1`, `/buildings`, etc.) and everything just works.

#### (Optional) Add a custom domain

Netlify Dashboard → **Domain management** → Add custom domain → follow DNS instructions.

---

## How the Netlify Build Works

`scripts/build-netlify.sh` does two things:

1. Copies `version1.2/static/` → `dist/static/`
2. Copies and renames Flask templates to plain HTML files:

| Flask template     | Netlify static file    | Clean URL    |
|--------------------|------------------------|--------------|
| `landing.html`     | `dist/index.html`      | `/`          |
| `index.html`       | `dist/dashboard.html`  | `/dashboard` |
| `login.html`       | `dist/login.html`      | `/login`     |
| `manage.html`      | `dist/manage.html`     | `/manage`    |

The clean URLs (`/dashboard`, `/login`, `/manage`) are handled by `netlify.toml` rewrites. API calls are routed to `netlify/functions/api.js` via the same redirect rules.

The templates contain no Jinja2 template variables — they're pure static HTML that Flask happens to serve via `render_template()`. On Netlify, they're served directly as static files with identical results.

---

## API Reference

| Method | Endpoint                | Description                           |
|--------|-------------------------|---------------------------------------|
| GET    | `/buildings`            | List all buildings                    |
| POST   | `/buildings`            | Add a new building                    |
| GET    | `/data/<id>?days=<n>`   | Historical daily data for a building  |
| POST   | `/data/<id>`            | Log a daily data record               |
| GET    | `/api/summary/<id>`     | EcoScore, carbon, alerts, recs        |
| GET    | `/api/portfolio`        | Portfolio overview (all buildings)    |
| GET    | `/api/forecast/<id>`    | 7-day energy & waste forecast         |
| GET    | `/api/alerts/<id>`      | Active alerts for a building          |

---

## Team

**Ubaid & Christina** at [Dyne Labs](https://www.dynelabs.org)
*HackUTD 2024 — CBRE Sustainability Challenge*

---

*EcoManage — Intelligent Sustainability for the Built World*
