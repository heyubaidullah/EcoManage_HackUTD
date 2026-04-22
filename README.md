# EcoManage — CBRE Intelligent Building Sustainability Platform

> **HackUTD 2024 — CBRE Challenge Submission**
> Built by Ubaid & Christina at [Dyne Labs](https://www.dynelabs.org)

---

## The Challenge

CBRE — the world's largest commercial real estate services firm — presented the following challenge at HackUTD 2024:

> **"Build a technology solution that helps CBRE property managers monitor, analyze, and optimize the sustainability performance of their building portfolio."**

Commercial buildings account for approximately 40% of global energy consumption and 30% of carbon emissions. Property managers overseeing large portfolios of buildings lack a unified, data-driven platform to track sustainability KPIs in real time, identify underperforming assets, and make actionable decisions to reduce their environmental impact.

### Key Pain Points Identified
- Fragmented data across buildings with no centralized view
- No automated alerting when sustainability thresholds are breached
- Difficulty benchmarking buildings against each other
- No AI-assisted recommendations for energy and operational efficiency
- Manual reporting with no trend visualization

---

## The Solution: EcoManage

EcoManage is a full-stack sustainability intelligence platform that gives CBRE property managers a live, portfolio-wide view of building performance — with a focus on actionable insights over raw data.

### Core Features

#### 🌿 EcoScore™ — Proprietary Sustainability Rating
A composite score (0–100) with letter grade (A–F) calculated from four weighted metrics:
- **Energy Consumption** (30%) — benchmarked against 80–220 kWh/day
- **HVAC Efficiency** (30%) — benchmarked against 40–90%
- **Temperature Control** (20%) — optimal range 19–25°C
- **Waste Generation** (20%) — benchmarked against 4–16 kg/day

#### 🌍 Carbon Footprint Tracking
Real-time CO₂e calculations using EPA conversion factors:
- Energy: 0.233 kg CO₂e per kWh (US grid average)
- Waste: 0.5 kg CO₂e per kg generated

#### 📊 Trend Visualization
Interactive multi-metric charts (7-day, 30-day, 90-day) built with Chart.js, enabling managers to spot seasonal patterns and long-term performance trends.

#### 🔔 Smart Alerts
Automated threshold breach detection with real-time alert counts per building — no more missed anomalies.

#### 💡 AI-Powered Recommendations
Context-aware, rule-based recommendations generated dynamically from the building's 7-day rolling averages. From HVAC maintenance prompts to waste reduction initiatives.

#### 🏢 Portfolio Overview
A visual grid of all properties with color-coded EcoScore™ badges (green/amber/red), enabling instant portfolio health assessment at a glance.

---

## What Makes It Innovative

1. **EcoScore™ composite rating** — translates complex multi-dimensional data into a single, actionable grade that any stakeholder can understand
2. **Carbon-first thinking** — every building view surfaces CO₂e impact, not just raw operational metrics
3. **Contextual recommendations** — not just alerts, but specific, prioritized actions tied to the building's current performance
4. **Portfolio intelligence** — see all buildings at once with immediate visual differentiation of high vs. low performers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python / Flask |
| Database | PostgreSQL |
| ORM | Flask-SQLAlchemy |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.x |
| Styling | Custom CBRE-branded design system |
| Hosting | Gunicorn on Replit / ecomanage.dynelabs.org |

---

## Running Locally

### Prerequisites
- Python 3.10+
- PostgreSQL database

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd version1.2

# Install dependencies
pip install -r requirements.txt

# Set environment variable
export DATABASE_URL=postgresql://user:password@localhost/ecomanage

# Run the app
python app.py
```

The app will automatically:
1. Create the database tables on first run
2. Seed 5 demo buildings with 90 days of realistic data

Then open [http://localhost:5000](http://localhost:5000)

### Requirements
```
Flask
Flask-CORS
Flask-SQLAlchemy
psycopg2-binary
gunicorn
```

---

## Project Structure

```
version1.2/
├── app.py                  # Flask app — routes, API, seed logic, EcoScore engine
├── models.py               # SQLAlchemy models (Building, DailyData)
├── requirements.txt        # Python dependencies
├── templates/
│   ├── index.html          # Main dashboard
│   └── manage.html         # Building management portal
├── static/
│   ├── main.css            # CBRE-branded design system
│   ├── dashboard.js        # Dashboard logic + Chart.js integration
│   ├── manage.js           # Management page logic
│   └── images/             # Building photography
└── data/
    └── schema.sql          # Database schema reference
```

---

## Live Demo

**[ecomanage.dynelabs.org](https://ecomanage.dynelabs.org)**

---

## Team

**Ubaid & Christina** at [Dyne Labs](https://www.dynelabs.org)
*HackUTD 2024 — CBRE Sustainability Challenge*

---

*EcoManage — Intelligent Sustainability for the Built World*
