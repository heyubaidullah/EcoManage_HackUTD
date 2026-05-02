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
- **AI Recommendations** — Context-aware, rule-based suggestions from 7-day rolling averages
- **Business Impact Row** — Daily cost, monthly projections, carbon tree offsets, ESG status
- **Portfolio Overview** — Visual grid of all properties with EcoScore badges

---

## Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Backend     | Python 3.12 / Flask                           |
| Database    | PostgreSQL (Replit built-in / Supabase / local) |
| ORM         | Flask-SQLAlchemy                              |
| Frontend    | HTML5, CSS3, Vanilla JavaScript               |
| Charts      | Chart.js 4.x                                  |
| Icons       | Font Awesome 6.5                              |
| Prod server | Gunicorn                                      |

---

## Project Structure

```
ecomanage/
├── version1.2/
│   ├── app.py                  # Flask app — routes, API, EcoScore engine, seed logic
│   ├── models.py               # SQLAlchemy models (Building, DailyData)
│   ├── requirements.txt        # Python dependencies (incl. gunicorn)
│   ├── templates/
│   │   ├── landing.html        # Public landing page  ( / )
│   │   ├── index.html          # Main dashboard       ( /dashboard )
│   │   ├── login.html          # Sign-in page         ( /login )
│   │   └── manage.html         # Building manager     ( /manage )
│   ├── static/
│   │   ├── main.css            # CBRE-branded design system
│   │   ├── dashboard.js        # Dashboard logic + Chart.js + EcoScore gauge
│   │   ├── manage.js           # Building management page logic
│   │   └── images/             # Building photography + logos
│   └── data/
│       └── schema.sql          # Database schema reference
│
├── scripts/
│   ├── build-netlify.sh        # Netlify static-site build script
│   └── post-merge.sh           # Replit post-merge hook
│
├── netlify.toml                # Netlify build config
├── render.yaml                 # Render.com service config
├── Procfile                    # Heroku / Railway process file
├── runtime.txt                 # Python version pin
└── .env.example                # Environment variable template
```

---

## Environment Variables

| Variable             | Required for              | Description                                                  |
|----------------------|---------------------------|--------------------------------------------------------------|
| `DATABASE_URL`       | All non-Replit deployments | PostgreSQL connection URI                                    |
| `ECOMANAGE_API_URL`  | Netlify frontend only      | Public URL of your deployed Flask backend (e.g. Render.com) |

> **Replit**: `DATABASE_URL` is injected automatically — no action needed.

---

## Deployment Options

### 1. Replit (current — already live)

The project runs as-is on Replit. No changes needed.

- **Run command**: `cd version1.2 && python app.py` (dev) or gunicorn (production)
- **Database**: Replit's built-in PostgreSQL (auto-configured via `DATABASE_URL`)
- **Live URL**: [ecomanage.dynelabs.org](https://ecomanage.dynelabs.org)

---

### 2. Local Development

**Prerequisites:** Python 3.10+, PostgreSQL (or a free Supabase project)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd ecomanage

# 2. Install dependencies
pip install -r version1.2/requirements.txt

# 3. Set your database URL
#    Option A — local PostgreSQL:
export DATABASE_URL=postgresql://postgres:password@localhost:5432/ecomanage

#    Option B — Supabase (see Supabase setup below):
export DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# 4. Run the app
cd version1.2
python app.py
```

Open [http://localhost:5000](http://localhost:5000). On first run, the app creates tables and seeds 5 demo buildings with 90 days of data automatically.

---

### 3. Free Cloud Deployment (Netlify + Render + Supabase)

This splits the app into:

```
Netlify  (static HTML/CSS/JS)
   ↓  API proxy via _redirects
Render.com  (Flask backend, free tier)
   ↓  DATABASE_URL
Supabase  (PostgreSQL, free tier)
```

All three services have generous free tiers — **$0/month**.

---

#### Step A — Set up Supabase (database)

1. Sign up at [supabase.com](https://supabase.com) → **New project**
2. Wait for provisioning (~2 min)
3. Go to **Settings → Database → Connection string → URI**
4. Copy the URI — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Save this — you'll need it in Steps B and C.

> The Flask app will auto-create tables and seed demo data on first boot.

---

#### Step B — Deploy backend on Render.com

1. Sign up at [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Render will detect `render.yaml` automatically. Confirm:
   - **Runtime**: Python
   - **Build command**: `pip install -r version1.2/requirements.txt`
   - **Start command**: `gunicorn --bind=0.0.0.0:$PORT --reuse-port --chdir=version1.2 app:app`
4. Under **Environment → Environment Variables**, add:
   ```
   DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
5. Click **Deploy**. After ~3 min, you'll get a URL like `https://ecomanage-api.onrender.com`.
6. **Copy this URL** — you need it for Netlify.

> **Free tier note**: Render free services spin down after 15 min of inactivity. The first request after a cold start may take ~30 s. Upgrade to Render Starter ($7/mo) for always-on.

---

#### Step C — Deploy frontend on Netlify

1. Sign up at [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Connect your GitHub repo
3. Netlify detects `netlify.toml` automatically. Build settings:
   - **Build command**: `bash scripts/build-netlify.sh`
   - **Publish directory**: `dist`
4. Under **Site → Environment variables**, add:
   ```
   ECOMANAGE_API_URL = https://ecomanage-api.onrender.com
   ```
   *(replace with your actual Render URL from Step B)*
5. Click **Deploy site**

Netlify will build the static site and configure API proxying automatically via `_redirects`. All browser requests to `/api/*`, `/buildings`, and `/data/*` are transparently forwarded to your Render backend — the frontend JavaScript requires no changes.

6. Optionally, add a custom domain under **Domain management**.

---

### 4. Railway (alternative to Render for the backend)

1. Sign up at [railway.app](https://railway.app) → **New project → Deploy from GitHub**
2. Connect your repo
3. Railway will use the `Procfile`:
   ```
   web: gunicorn --bind=0.0.0.0:$PORT --reuse-port --chdir=version1.2 app:app
   ```
4. Add the `DATABASE_URL` environment variable (Supabase URI from Step A)
5. Your app URL will be something like `https://ecomanage-api.up.railway.app`
6. Use this URL as `ECOMANAGE_API_URL` in Netlify

---

## How the Netlify Build Works

`scripts/build-netlify.sh` does three things:

1. **Copies** `version1.2/static/` → `dist/static/`
2. **Copies and renames** Flask templates into `dist/` as plain HTML files:
   - `landing.html` → `dist/index.html`
   - `index.html` → `dist/dashboard.html`
   - `login.html` → `dist/login.html`
   - `manage.html` → `dist/manage.html`
3. **Generates** `dist/_redirects` with:
   - Clean URL rewrites (`/dashboard` → `dashboard.html`, etc.)
   - API proxy rules pointing to `$ECOMANAGE_API_URL`

The templates use zero Jinja2 template variables — they are pure static HTML served by Flask. This means they work identically as static files on Netlify.

---

## API Reference

| Method | Endpoint                    | Description                              |
|--------|-----------------------------|------------------------------------------|
| GET    | `/buildings`                | List all buildings                       |
| POST   | `/buildings`                | Add a new building                       |
| GET    | `/data/<id>?days=<n>`       | Historical daily data for a building     |
| POST   | `/data/<id>`                | Log a daily data record                  |
| GET    | `/api/summary/<id>`         | EcoScore, alerts, recommendations        |
| GET    | `/api/portfolio`            | Portfolio overview (all buildings)       |
| GET    | `/api/forecast/<id>`        | 7-day energy & waste forecast            |
| GET    | `/api/alerts/<id>`          | Active alerts for a building             |

---

## Team

**Ubaid & Christina** at [Dyne Labs](https://www.dynelabs.org)
*HackUTD 2024 — CBRE Sustainability Challenge*

---

*EcoManage — Intelligent Sustainability for the Built World*
