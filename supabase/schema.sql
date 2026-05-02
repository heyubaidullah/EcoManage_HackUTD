-- ─────────────────────────────────────────────────────────────────────────────
--  EcoManage — Supabase Schema
--  Tables are prefixed with "em_" so this project can share a Supabase
--  project with other apps without naming conflicts.
--
--  Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS em_buildings (
  id      SERIAL       PRIMARY KEY,
  name    VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS em_daily_data (
  id          SERIAL  PRIMARY KEY,
  building_id INTEGER NOT NULL REFERENCES em_buildings(id) ON DELETE CASCADE,
  date        DATE    NOT NULL,
  energy      FLOAT   NOT NULL,   -- kWh
  hvac        FLOAT   NOT NULL,   -- %
  temperature FLOAT   NOT NULL,   -- °C
  waste       FLOAT   NOT NULL    -- kg
);

CREATE INDEX IF NOT EXISTS idx_em_daily_data_building_date
  ON em_daily_data (building_id, date);

-- ─────────────────────────────────────────────────────────────────────────────
--  Row Level Security — disabled for this demo app.
--  Enable and configure policies before going to production.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE em_buildings  DISABLE ROW LEVEL SECURITY;
ALTER TABLE em_daily_data DISABLE ROW LEVEL SECURITY;
