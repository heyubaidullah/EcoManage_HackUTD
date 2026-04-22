/* EcoManage Dashboard — dashboard.js */

const API = '';  // relative URLs — same origin

let buildings = [];
let currentBuildingId = null;
let currentDays = 30;
let trendChart = null;
let activeMetrics = new Set(['energy', 'hvac', 'temperature', 'waste']);

const METRIC_CONFIG = {
  energy:      { label: 'Energy (kWh)',     color: '#3CA358', yAxis: 'y1' },
  hvac:        { label: 'HVAC (%)',          color: '#003F2D', yAxis: 'y2' },
  temperature: { label: 'Temperature (°C)', color: '#f59e0b', yAxis: 'y3' },
  waste:       { label: 'Waste (kg)',        color: '#ef4444', yAxis: 'y4' },
};

/* ── TOAST ─────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'fade-out 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

/* ── BUILDINGS ──────────────────────────────────────── */
async function fetchBuildings() {
  try {
    const res = await fetch(`${API}/buildings`);
    buildings = await res.json();
    const sel = document.getElementById('building-select');
    sel.innerHTML = '';
    buildings.forEach(b => {
      const o = document.createElement('option');
      o.value = b.id;
      o.textContent = b.name;
      sel.appendChild(o);
    });
    if (buildings.length > 0) {
      selectBuilding(buildings[0].id);
    }
  } catch (e) {
    console.error('Failed to load buildings', e);
    showToast('Could not load buildings — check server connection', 'error');
  }
}

function selectBuilding(id) {
  currentBuildingId = id;
  const b = buildings.find(x => x.id == id);
  if (b) {
    const ctxName = document.getElementById('ctx-name');
    const ctxAddr = document.getElementById('ctx-addr');
    const ctxImg  = document.getElementById('ctx-img');
    if (ctxName) ctxName.textContent = b.name;
    if (ctxAddr) ctxAddr.textContent = b.address;
    if (ctxImg) {
      ctxImg.src = `/static/${b.image}`;
      ctxImg.onerror = function() { this.src = '/static/images/CBRE_Downtown.jpg'; };
    }
  }
  loadSummary(id);
  loadTrend(id, currentDays);
  loadPortfolio();
}

/* ── SUMMARY (KPI + ALERTS + RECS) ─────────────────── */
async function loadSummary(buildingId) {
  try {
    const res = await fetch(`${API}/api/summary/${buildingId}`);
    if (!res.ok) throw new Error('No data');
    const data = await res.json();

    // EcoScore
    document.getElementById('score-num').textContent = data.ecoscore;
    const badge = document.getElementById('grade-badge');
    badge.textContent = data.grade;
    badge.style.background = data.grade_color;

    // Carbon
    document.getElementById('kpi-carbon').textContent = data.carbon_footprint;

    // Alerts count
    document.getElementById('kpi-alerts').textContent = data.alert_count;
    document.getElementById('kpi-alerts-sub').textContent =
      data.alert_count === 0 ? 'All systems within range' : `${data.alert_count} threshold breach${data.alert_count > 1 ? 'es' : ''} detected`;

    // Stat row
    const l = data.latest;
    document.getElementById('stat-energy').innerHTML = `${l.energy}<span class="stat-mini-unit"> kWh</span>`;
    document.getElementById('stat-hvac').innerHTML   = `${l.hvac}<span class="stat-mini-unit"> %</span>`;
    document.getElementById('stat-temp').innerHTML   = `${l.temperature}<span class="stat-mini-unit"> °C</span>`;
    document.getElementById('stat-waste').innerHTML  = `${l.waste}<span class="stat-mini-unit"> kg</span>`;

    // Update building context bar EcoScore
    const ctxGrade = document.getElementById('ctx-grade');
    const ctxScoreNum = document.getElementById('ctx-score-num');
    if (ctxGrade) { ctxGrade.textContent = data.grade; ctxGrade.style.background = data.grade_color; }
    if (ctxScoreNum) ctxScoreNum.textContent = data.ecoscore;

    // Alerts list
    renderAlerts(data.alerts);

    // Recommendations
    renderRecommendations(data.recommendations);

  } catch (e) {
    document.getElementById('score-num').textContent = 'N/A';
    document.getElementById('kpi-carbon').textContent = '—';
    document.getElementById('kpi-alerts').textContent = '—';
    renderAlerts([]);
    renderRecommendations([]);
  }
}

function renderAlerts(alerts) {
  const el = document.getElementById('alerts-list');
  if (!alerts || alerts.length === 0) {
    el.innerHTML = `<div class="alert-no-issues">✅ No active alerts — all metrics within target range.</div>`;
    return;
  }
  el.innerHTML = alerts.map(a => `
    <div class="alert-item">
      <div class="alert-dot ${a.type}"></div>
      <div>
        <div style="font-weight:600;font-size:12px;color:var(--text-primary)">${a.metric}</div>
        <div style="font-size:11px;color:var(--text-secondary)">${a.message}</div>
      </div>
    </div>
  `).join('');
}

function renderRecommendations(recs) {
  const el = document.getElementById('recs-list');
  if (!recs || recs.length === 0) {
    el.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">No recommendations available.</div>`;
    return;
  }
  el.innerHTML = recs.map(r => `
    <div class="rec-item">
      <div class="rec-icon">${r.icon}</div>
      <div class="rec-content">
        <div class="rec-title">${r.title}</div>
        <div class="rec-body">${r.body}</div>
      </div>
    </div>
  `).join('');
}

/* ── TREND CHART ────────────────────────────────────── */
async function loadTrend(buildingId, days) {
  try {
    const [histRes, forecastRes] = await Promise.all([
      fetch(`${API}/data/${buildingId}?days=${days}`),
      fetch(`${API}/api/forecast/${buildingId}`)
    ]);
    if (!histRes.ok) {
      console.error('Failed to fetch historical data');
      renderForecastSection([]);
      return;
    }
    const data = await histRes.json();
    const forecastData = forecastRes.ok ? (await forecastRes.json()).forecasts || [] : [];

    const histLabels = data.map(d => {
      const dt = new Date(d.date + 'T00:00:00');
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const forecastLabels = forecastData.map(d => {
      const dt = new Date(d.date + 'T00:00:00');
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const allLabels = [...histLabels, ...forecastLabels];
    const histLen = data.length;
    const forecastLen = forecastData.length;

    const datasets = [];

    for (const [key, cfg] of Object.entries(METRIC_CONFIG)) {
      datasets.push({
        label: cfg.label,
        data: [...data.map(d => d[key]), ...Array(forecastLen).fill(null)],
        borderColor: cfg.color,
        backgroundColor: cfg.color + '18',
        borderWidth: 2,
        pointRadius: days <= 7 ? 4 : (days <= 30 ? 2 : 1),
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
        hidden: !activeMetrics.has(key),
        yAxisID: cfg.yAxis,
        spanGaps: false,
      });
    }

    if (forecastLen > 0) {
      const padLen = Math.max(0, histLen - 1);
      const energyAnchor = histLen > 0 ? [data[histLen - 1].energy] : [];
      const wasteAnchor  = histLen > 0 ? [data[histLen - 1].waste]  : [];

      datasets.push({
        label: 'Energy Forecast (kWh)',
        data: [
          ...Array(padLen).fill(null),
          ...energyAnchor,
          ...forecastData.map(d => d.energy)
        ],
        borderColor: '#3CA358',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 3,
        pointHoverRadius: 5,
        pointStyle: 'circle',
        tension: 0.3,
        fill: false,
        hidden: !activeMetrics.has('energy'),
        yAxisID: 'y1',
        spanGaps: false,
      });

      datasets.push({
        label: 'Waste Forecast (kg)',
        data: [
          ...Array(padLen).fill(null),
          ...wasteAnchor,
          ...forecastData.map(d => d.waste)
        ],
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 3,
        pointHoverRadius: 5,
        pointStyle: 'circle',
        tension: 0.3,
        fill: false,
        hidden: !activeMetrics.has('waste'),
        yAxisID: 'y4',
        spanGaps: false,
      });
    }

    if (trendChart) {
      trendChart.data.labels = allLabels;
      trendChart.data.datasets = datasets;
      trendChart.update();
    } else {
      const ctx = document.getElementById('trend-chart').getContext('2d');
      trendChart = new Chart(ctx, {
        type: 'line',
        data: { labels: allLabels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#fff',
              titleColor: '#003F2D',
              bodyColor: '#5c7268',
              borderColor: '#d5e3de',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                title: (items) => items[0].label,
                label: (item) => {
                  const isForecast = item.dataset.label.includes('Forecast');
                  return `${item.dataset.label}: ${item.formattedValue}${isForecast ? ' (estimate)' : ''}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: '#f0f4f2' },
              ticks: { color: '#8fa89f', font: { size: 10 }, maxTicksLimit: 12 }
            },
            y1: {
              type: 'linear', position: 'left',
              grid: { color: '#f0f4f2' },
              ticks: { color: '#3CA358', font: { size: 10 } },
              title: { display: true, text: 'kWh / kg', color: '#8fa89f', font: { size: 10 } }
            },
            y2: {
              type: 'linear', position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#003F2D', font: { size: 10 } },
              title: { display: true, text: '%', color: '#8fa89f', font: { size: 10 } }
            },
            y3: {
              type: 'linear', display: false,
            },
            y4: {
              type: 'linear', display: false,
            }
          }
        }
      });
    }

    renderForecastSection(forecastData);

  } catch (e) {
    console.error('Failed to load trend data', e);
  }
}

/* ── FORECAST SECTION ───────────────────────────────── */
function renderForecastSection(forecasts) {
  const el = document.getElementById('forecast-rows');
  if (!el) return;
  if (!forecasts || forecasts.length === 0) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;">No forecast available.</div>';
    return;
  }
  el.innerHTML = forecasts.map(f => {
    const dt = new Date(f.date + 'T00:00:00');
    const label = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `
      <div class="forecast-row">
        <div class="forecast-date">${label}</div>
        <div class="forecast-val energy-val">
          <span class="forecast-dot" style="background:#3CA358"></span>
          ${f.energy} <span class="forecast-unit">kWh</span>
        </div>
        <div class="forecast-val waste-val">
          <span class="forecast-dot" style="background:#ef4444"></span>
          ${f.waste} <span class="forecast-unit">kg</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ── PORTFOLIO ──────────────────────────────────────── */
async function loadPortfolio() {
  try {
    const res = await fetch(`${API}/api/portfolio`);
    const portfolio = await res.json();
    const grid = document.getElementById('portfolio-grid');
    document.getElementById('portfolio-count').textContent = `${portfolio.length} propert${portfolio.length !== 1 ? 'ies' : 'y'}`;

    grid.innerHTML = portfolio.map(p => {
      const scoreDisplay = p.ecoscore !== null ? p.ecoscore : '—';
      const alertText = p.alert_count > 0 ? `${p.alert_count} alert${p.alert_count > 1 ? 's' : ''}` : '✓ No alerts';
      const alertClass = p.alert_count > 0 ? '' : 'none';
      return `
        <div class="portfolio-tile" onclick="switchBuilding(${p.id})" title="${p.name}">
          <img src="/static/${p.image}" alt="${p.name}" onerror="this.src='/static/images/CBRE_Downtown.jpg'">
          <div class="portfolio-tile-body">
            <div class="portfolio-tile-name">${p.name}</div>
            <div class="portfolio-tile-addr">${p.address}</div>
            <div class="portfolio-tile-footer">
              <div class="score-badge">
                <span class="grade" style="background:${p.grade_color}">${p.grade}</span>
                <span class="score-num">${scoreDisplay}</span>
              </div>
              <span class="alert-pill ${alertClass}">${alertText}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    document.getElementById('portfolio-grid').innerHTML = '<div style="color:var(--text-muted);">Could not load portfolio data.</div>';
  }
}

function switchBuilding(id) {
  const sel = document.getElementById('building-select');
  sel.value = id;
  selectBuilding(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── METRIC TOGGLES ─────────────────────────────────── */
document.querySelectorAll('.metric-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const metric = btn.dataset.metric;
    if (activeMetrics.has(metric)) {
      if (activeMetrics.size === 1) return; // keep at least one
      activeMetrics.delete(metric);
      btn.classList.remove('active');
    } else {
      activeMetrics.add(metric);
      btn.classList.add('active');
    }
    if (trendChart) {
      trendChart.data.datasets.forEach(ds => {
        const key = Object.keys(METRIC_CONFIG).find(k => METRIC_CONFIG[k].label === ds.label);
        if (key) {
          ds.hidden = !activeMetrics.has(key);
        } else if (ds.label === 'Energy Forecast (kWh)') {
          ds.hidden = !activeMetrics.has('energy');
        } else if (ds.label === 'Waste Forecast (kg)') {
          ds.hidden = !activeMetrics.has('waste');
        }
      });
      trendChart.update();
    }
  });
});

/* ── RANGE TABS ─────────────────────────────────────── */
document.querySelectorAll('.range-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.range-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDays = parseInt(btn.dataset.days);
    if (currentBuildingId) loadTrend(currentBuildingId, currentDays);
  });
});

/* ── BUILDING SELECT ────────────────────────────────── */
document.getElementById('building-select').addEventListener('change', e => {
  selectBuilding(parseInt(e.target.value));
});

/* ── INIT ───────────────────────────────────────────── */
fetchBuildings();
