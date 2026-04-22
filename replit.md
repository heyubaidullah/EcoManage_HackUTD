# EcoManage

A building sustainability and energy management dashboard branded for CBRE. Allows users to track energy consumption, HVAC usage, temperature, and waste management across buildings.

## Tech Stack
- **Backend:** Python / Flask
- **Database:** PostgreSQL (Replit built-in, via `DATABASE_URL` env var)
- **ORM:** Flask-SQLAlchemy
- **Frontend:** HTML + Bootstrap 5 + Vanilla JavaScript (served via Flask templates)

## Project Layout
- `version1.2/` — Main application directory
  - `app.py` — Flask app entry point and API routes
  - `models.py` — SQLAlchemy models (Building, DailyData)
  - `requirements.txt` — Python dependencies
  - `templates/` — HTML templates (index.html, add-building.html)
  - `static/` — CSS, JS, images
  - `data/` — Schema and sample SQL files

## Running
The app runs via the "Start application" workflow:
```
cd version1.2 && python app.py
```
Serves on `0.0.0.0:5000`.

## Database
Uses Replit's built-in PostgreSQL. Connection string read from `DATABASE_URL` environment variable.

Tables:
- `buildings` — Building name and address
- `daily_data` — Daily energy, HVAC, temperature, and waste readings per building

## Key Routes
- `GET /` — Dashboard
- `GET /add-building` — Add building form
- `GET /buildings` — List all buildings (JSON)
- `POST /buildings` — Create a building
- `GET /data/<id>` — Get daily data for a building (with date range filters)
- `POST /data/<id>` — Add daily data for a building
