-- ─────────────────────────────────────────────────────────────────────────────
--  EcoManage — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id      SERIAL       PRIMARY KEY,
  name    VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL
);

-- Daily sensor data table
CREATE TABLE IF NOT EXISTS daily_data (
  id          SERIAL  PRIMARY KEY,
  building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  date        DATE    NOT NULL,
  energy      FLOAT   NOT NULL,   -- kWh
  hvac        FLOAT   NOT NULL,   -- %
  temperature FLOAT   NOT NULL,   -- °C
  waste       FLOAT   NOT NULL    -- kg
);

-- Index for fast per-building date range queries
CREATE INDEX IF NOT EXISTS idx_daily_data_building_date
  ON daily_data (building_id, date);

-- ─────────────────────────────────────────────────────────────────────────────
--  Row Level Security
--  Disabled for this demo app. Enable and configure policies for production.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE buildings  DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_data DISABLE ROW LEVEL SECURITY;
