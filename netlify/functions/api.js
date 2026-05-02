import { createClient } from '@supabase/supabase-js';

// ── Constants (ported 1-to-1 from version1.2/app.py) ─────────────────────────

const BENCHMARKS = {
  energy:      { excellent: 80,  poor: 220 },
  hvac:        { excellent: 40,  poor: 90  },
  temperature: { ideal: 22, tolerance: 3   },
  waste:       { excellent: 4,   poor: 16  },
};

const ALERT_THRESHOLDS = {
  energy:    180,
  hvac:      78,
  temp_low:  19,
  temp_high: 25,
  waste:     12,
};

const BUILDING_IMAGES = {
  'CBRE Downtown':          'images/CBRE_Downtown.jpg',
  'CBRE Tech Hub':          'images/CBRE_Tech_Space.jpg',
  'CBRE Innovation Center': 'images/CBRE_One.jpg',
  'CBRE Plaza Tower':       'images/CBRE_Downtown.jpg',
  'CBRE Commerce Park':     'images/CBRE_Tech_Space.jpg',
};

// ── Business Logic ────────────────────────────────────────────────────────────

function calculateEcoScore(energy, hvac, temperature, waste) {
  const { excellent: eEx, poor: ePoor } = BENCHMARKS.energy;
  const energyScore = Math.max(0, Math.min(100, (ePoor - energy) / (ePoor - eEx) * 100));

  const { excellent: hEx, poor: hPoor } = BENCHMARKS.hvac;
  const hvacScore = Math.max(0, Math.min(100, (hPoor - hvac) / (hPoor - hEx) * 100));

  const { ideal, tolerance } = BENCHMARKS.temperature;
  const tempScore = Math.max(0, 100 - (Math.abs(temperature - ideal) / tolerance) * 50);

  const { excellent: wEx, poor: wPoor } = BENCHMARKS.waste;
  const wasteScore = Math.max(0, Math.min(100, (wPoor - waste) / (wPoor - wEx) * 100));

  const score = 0.30 * energyScore + 0.30 * hvacScore + 0.20 * tempScore + 0.20 * wasteScore;
  return Math.round(score * 10) / 10;
}

function getGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function getGradeColor(grade) {
  const colors = { A: '#22c55e', B: '#3CA358', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
  return colors[grade] ?? '#6b7280';
}

function calculateCarbon(energy, waste) {
  return Math.round((energy * 0.233 + waste * 0.5) * 100) / 100;
}

function generateAlerts(energy, hvac, temperature, waste) {
  const alerts = [];
  const t = ALERT_THRESHOLDS;
  if (energy > t.energy)
    alerts.push({ type: 'warning', metric: 'Energy',      message: `Energy consumption at ${Math.round(energy)} kWh exceeds target of ${t.energy} kWh` });
  if (hvac > t.hvac)
    alerts.push({ type: 'warning', metric: 'HVAC',        message: `HVAC running at ${Math.round(hvac)}% — consider scheduling maintenance` });
  if (temperature < t.temp_low)
    alerts.push({ type: 'info',    metric: 'Temperature', message: `Temperature at ${temperature.toFixed(1)}°C is below comfort range (19–25°C)` });
  if (temperature > t.temp_high)
    alerts.push({ type: 'warning', metric: 'Temperature', message: `Temperature at ${temperature.toFixed(1)}°C exceeds comfort range (19–25°C)` });
  if (waste > t.waste)
    alerts.push({ type: 'warning', metric: 'Waste',       message: `Waste generation at ${waste.toFixed(1)} kg exceeds daily target of ${t.waste} kg` });
  return alerts;
}

function generateRecommendations(avgEnergy, avgHvac, avgTemp, avgWaste) {
  const recs = [];

  if (avgEnergy > 160)
    recs.push({ icon: '⚡', title: 'Optimize Energy Scheduling',   body: 'Average energy consumption is above target. Consider implementing automated lighting controls and reviewing equipment standby schedules.' });
  else if (avgEnergy < 100)
    recs.push({ icon: '⚡', title: 'Excellent Energy Performance',  body: "Energy usage is well within benchmarks. Consider sharing this building's practices across your portfolio." });

  if (avgHvac > 72)
    recs.push({ icon: '❄️', title: 'HVAC Efficiency Review',        body: 'HVAC is running at high capacity. A preventative maintenance check and filter inspection could reduce usage by up to 15%.' });
  else if (avgHvac < 50)
    recs.push({ icon: '❄️', title: 'HVAC Performing Well',          body: 'HVAC usage is highly efficient. Ensure regular filter changes to maintain this level of performance.' });

  if (avgTemp < 20)
    recs.push({ icon: '🌡️', title: 'Heating Adjustment Needed',    body: 'Temperature is below the recommended comfort range. Review heating set-points to improve occupant comfort and productivity.' });
  else if (avgTemp > 24)
    recs.push({ icon: '🌡️', title: 'Cooling Review Recommended',   body: 'Temperature is trending above comfort range. Inspect cooling systems and check building insulation for potential improvements.' });

  if (avgWaste > 11)
    recs.push({ icon: '♻️', title: 'Waste Reduction Opportunity',  body: 'Waste output exceeds the sustainability target. Consider launching a tenant recycling initiative and reviewing supplier packaging requirements.' });
  else if (avgWaste < 7)
    recs.push({ icon: '♻️', title: 'Waste Management Leader',      body: 'This building is a waste reduction leader in your portfolio. Document and replicate these practices across other properties.' });

  const neutralPool = [
    { icon: '📅', title: 'Schedule Quarterly Sustainability Audit', body: 'Regular audits help identify hidden inefficiencies. Benchmark against LEED and ENERGY STAR standards to maintain portfolio leadership.' },
    { icon: '🏆', title: 'All Systems Optimal',                     body: 'This building is performing within all sustainability targets. Continue current practices and monitor for seasonal variations.' },
    { icon: '🌱', title: 'Explore Renewable Energy Options',        body: 'Consider evaluating rooftop solar or green energy purchasing agreements to reduce grid dependency and lower carbon footprint further.' },
    { icon: '👥', title: 'Engage Tenants in Sustainability Goals',  body: "Tenant engagement programmes can drive 10–15% additional energy savings. Share this building's EcoScore™ with occupants to build shared accountability." },
  ];

  while (recs.length < 2) {
    const candidate = neutralPool[recs.length % neutralPool.length];
    if (!recs.some(r => r.title === candidate.title)) recs.push(candidate);
  }

  return recs.slice(0, 3);
}

function linearRegression(values) {
  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const sumX  = xs.reduce((a, b) => a + b, 0);
  const sumY  = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * values[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX ** 2;
  if (denom === 0) return [0, sumY / n];
  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return [slope, intercept];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json', ...CORS }, body: JSON.stringify(data) };
}

function toDateStr(d) { return d.toISOString().split('T')[0]; }
function daysAgo(n)   { const d = new Date(); d.setDate(d.getDate() - n); return toDateStr(d); }
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
function avg(rows, key) { return rows.length ? rows.reduce((s, r) => s + r[key], 0) / rows.length : 0; }
function round1(v)  { return Math.round(v * 10) / 10; }

// ── Route Handlers ────────────────────────────────────────────────────────────

async function getBuildings(sb) {
  const { data, error } = await sb.from('em_buildings').select('*').order('id');
  if (error) throw error;
  return json(data.map(b => ({ id: b.id, name: b.name, address: b.address, image: BUILDING_IMAGES[b.name] ?? 'images/CBRE_Downtown.jpg' })));
}

async function addBuilding(sb, body) {
  const { data, error } = await sb.from('em_buildings').insert({ name: body.name, address: body.address }).select().single();
  if (error) throw error;
  return json({ message: 'Building added successfully!', id: data.id }, 201);
}

async function getDailyData(sb, buildingId, days) {
  const { data, error } = await sb.from('em_daily_data').select('*')
    .eq('building_id', buildingId).gte('date', daysAgo(days)).order('date');
  if (error) throw error;
  return json(data.map(d => ({ date: d.date, energy: d.energy, hvac: d.hvac, temperature: d.temperature, waste: d.waste })));
}

async function addDailyData(sb, buildingId, body) {
  const { error } = await sb.from('em_daily_data').insert({
    building_id: buildingId, date: body.date,
    energy: body.energy, hvac: body.hvac, temperature: body.temperature, waste: body.waste,
  });
  if (error) throw error;
  return json({ message: 'Data added successfully!' }, 201);
}

async function getSummary(sb, buildingId) {
  const { data: latest, error } = await sb.from('em_daily_data').select('*')
    .eq('building_id', buildingId).order('date', { ascending: false }).limit(1).single();
  if (error) return json({ error: 'No data available' }, 404);

  const { data: recent } = await sb.from('em_daily_data').select('*')
    .eq('building_id', buildingId).gte('date', daysAgo(7));

  const rec = recent ?? [latest];
  const avgE = avg(rec, 'energy');
  const avgH = avg(rec, 'hvac');
  const avgT = avg(rec, 'temperature');
  const avgW = avg(rec, 'waste');

  const score   = calculateEcoScore(avgE, avgH, avgT, avgW);
  const grade   = getGrade(score);
  const alerts  = generateAlerts(latest.energy, latest.hvac, latest.temperature, latest.waste);
  const recs    = generateRecommendations(avgE, avgH, avgT, avgW);

  return json({
    ecoscore: score, grade, grade_color: getGradeColor(grade),
    carbon_footprint: calculateCarbon(latest.energy, latest.waste),
    alerts, alert_count: alerts.length, recommendations: recs,
    latest: { date: latest.date, energy: latest.energy, hvac: latest.hvac, temperature: latest.temperature, waste: latest.waste },
    averages: { energy: round1(avgE), hvac: round1(avgH), temperature: round1(avgT), waste: round1(avgW) },
  });
}

async function getPortfolio(sb) {
  const { data: buildings } = await sb.from('em_buildings').select('*').order('id');
  const cutoff = daysAgo(7);

  const portfolio = await Promise.all((buildings ?? []).map(async b => {
    const { data: recent } = await sb.from('em_daily_data').select('*')
      .eq('building_id', b.id).gte('date', cutoff).order('date', { ascending: false });
    const { data: [last] = [] } = await sb.from('em_daily_data').select('*')
      .eq('building_id', b.id).order('date', { ascending: false }).limit(1);

    const base = { id: b.id, name: b.name, address: b.address, image: BUILDING_IMAGES[b.name] ?? 'images/CBRE_Downtown.jpg' };

    if (!last) return { ...base, ecoscore: null, grade: 'N/A', grade_color: '#6b7280', alert_count: 0, carbon: 0, energy: 0, hvac: 0 };

    const rows = recent?.length ? recent : [last];
    const avgE = avg(rows, 'energy');
    const avgH = avg(rows, 'hvac');
    const avgT = avg(rows, 'temperature');
    const avgW = avg(rows, 'waste');
    const score = calculateEcoScore(avgE, avgH, avgT, avgW);
    const grade = getGrade(score);

    return {
      ...base, ecoscore: score, grade, grade_color: getGradeColor(grade),
      alert_count: generateAlerts(last.energy, last.hvac, last.temperature, last.waste).length,
      carbon: calculateCarbon(last.energy, last.waste),
      energy: round1(avgE), hvac: round1(avgH),
    };
  }));

  return json(portfolio);
}

async function getForecast(sb, buildingId) {
  const { data: records } = await sb.from('em_daily_data').select('*')
    .eq('building_id', buildingId).gte('date', daysAgo(30)).order('date');

  if (!records || records.length < 2) return json({ error: 'Not enough data to forecast' }, 400);

  const [eSlope, eInt] = linearRegression(records.map(r => r.energy));
  const [wSlope, wInt] = linearRegression(records.map(r => r.waste));
  const n = records.length;
  const lastDate = records[n - 1].date;

  const forecasts = Array.from({ length: 7 }, (_, k) => ({
    date:   addDays(lastDate, k + 1),
    energy: Math.max(50,  round1(eSlope * (n + k) + eInt)),
    waste:  Math.max(1,   round1(wSlope * (n + k) + wInt)),
  }));

  return json({ forecasts });
}

async function getAlerts(sb, buildingId) {
  const { data: [last] = [] } = await sb.from('em_daily_data').select('*')
    .eq('building_id', buildingId).order('date', { ascending: false }).limit(1);
  if (!last) return json([]);
  return json(generateAlerts(last.energy, last.hvac, last.temperature, last.waste));
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  const url  = process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.' }, 500);
  }

  const sb     = createClient(url, key, { auth: { persistSession: false } });
  const path   = event.path;
  const method = event.httpMethod;

  try {
    if (path === '/buildings' && method === 'GET')  return await getBuildings(sb);
    if (path === '/buildings' && method === 'POST') return await addBuilding(sb, JSON.parse(event.body || '{}'));

    const dataMatch = path.match(/^\/data\/(\d+)$/);
    if (dataMatch && method === 'GET')  return await getDailyData(sb, +dataMatch[1], +(event.queryStringParameters?.days ?? 30));
    if (dataMatch && method === 'POST') return await addDailyData(sb, +dataMatch[1], JSON.parse(event.body || '{}'));

    const summaryMatch = path.match(/^\/api\/summary\/(\d+)$/);
    if (summaryMatch) return await getSummary(sb, +summaryMatch[1]);

    if (path === '/api/portfolio') return await getPortfolio(sb);

    const forecastMatch = path.match(/^\/api\/forecast\/(\d+)$/);
    if (forecastMatch) return await getForecast(sb, +forecastMatch[1]);

    const alertsMatch = path.match(/^\/api\/alerts\/(\d+)$/);
    if (alertsMatch) return await getAlerts(sb, +alertsMatch[1]);

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    console.error('[EcoManage API]', err);
    return json({ error: 'Internal server error', detail: err.message }, 500);
  }
};
