/* EcoManage Dashboard — dashboard.js */

const API = '';

let buildings = [];
let currentBuildingId = null;
let currentDays = 30;
let trendChart = null;
let activeMetrics = new Set(['energy', 'hvac', 'temperature', 'waste']);
let lastForecastLen = 0;
let lastHistLen = 0;

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
  const icon = type === 'success'
    ? '<i class="fa-solid fa-check-circle" style="color:#3CA358"></i>'
    : '<i class="fa-solid fa-circle-exclamation" style="color:#ef4444"></i>';
  t.innerHTML = `${icon} ${msg}`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3800);
}

/* ── ECOSCORE GAUGE ─────────────────────────────────── */
function updateGauge(score, gradeColor, grade) {
  const r = 42;
  const circ = 2 * Math.PI * r;   // ≈ 263.9
  const trackLen = circ * 0.75;   // 270° arc = 197.9

  const arc     = document.getElementById('gauge-arc');
  const numEl   = document.getElementById('gauge-num');
  const gradeEl = document.getElementById('gauge-grade-text');

  if (arc) {
    const fillLen = (parseFloat(score) / 100) * trackLen;
    arc.setAttribute('stroke', gradeColor);
    arc.setAttribute('stroke-dasharray', `${fillLen.toFixed(1)} ${(circ - fillLen).toFixed(1)}`);
  }
  if (numEl) numEl.textContent = score;
  if (gradeEl) {
    gradeEl.textContent = grade;
    gradeEl.setAttribute('fill', gradeColor);
  }
}

/* ── BUSINESS METRICS ───────────────────────────────── */
function renderBusinessMetrics(data) {
  const energy = parseFloat(data.latest.energy);
  const carbon = parseFloat(data.carbon_footprint);

  // Daily energy cost @ $0.12/kWh
  const dailyCost = (energy * 0.12).toFixed(2);
  // Monthly projection
  const monthlyProj = (energy * 30 * 0.12).toFixed(0);
  // Baseline: 200 kWh/day → $720/month
  const baselineMonthly = 200 * 30 * 0.12;
  const savings = (baselineMonthly - energy * 30 * 0.12).toFixed(0);
  const savingsNum = parseFloat(savings);

  // CO₂ trees: 1 tree absorbs ~21 kg/year → 21/365 per day
  // Annual offset equivalent from today's carbon
  const treesEq = Math.round(carbon * 365 / 21);

  // ESG status based on grade
  const grade = data.grade;
  let esgText, esgClass, esgSub;
  if (['A'].includes(grade)) {
    esgText = '✓ Exceeding Target'; esgClass = 'biz-status-ok'; esgSub = 'Top 10% of CBRE portfolio';
  } else if (['B'].includes(grade)) {
    esgText = '✓ On Track'; esgClass = 'biz-status-ok'; esgSub = 'Meeting CBRE sustainability goals';
  } else if (['C'].includes(grade)) {
    esgText = '⚠ Needs Attention'; esgClass = 'biz-status-warn'; esgSub = 'Below CBRE target — review recommended';
  } else {
    esgText = '✕ Action Required'; esgClass = 'biz-status-bad'; esgSub = 'Significant gap from sustainability target';
  }

  // Daily cost
  const costEl = document.getElementById('biz-cost');
  if (costEl) costEl.innerHTML = `$${dailyCost}<span class="unit"> USD</span>`;

  // Monthly
  const monthEl = document.getElementById('biz-monthly');
  const monthSub = document.getElementById('biz-monthly-sub');
  if (monthEl) monthEl.innerHTML = `$${monthlyProj}<span class="unit"> USD</span>`;
  if (monthSub) {
    if (savingsNum > 0) {
      monthSub.innerHTML = `<span style="color:#22c55e;font-weight:600">▼ $${savingsNum} below baseline</span> (saving money)`;
    } else {
      monthSub.innerHTML = `<span style="color:#ef4444;font-weight:600">▲ $${Math.abs(savingsNum)} above baseline</span> (200 kWh/day)`;
    }
  }

  // Trees
  const treesEl = document.getElementById('biz-trees');
  if (treesEl) treesEl.innerHTML = `${treesEq}<span class="unit"> trees/yr</span>`;

  // Carbon trees KPI
  const carbonTrees = document.getElementById('carbon-trees');
  if (carbonTrees) {
    carbonTrees.innerHTML = `<i class="fa-solid fa-tree" style="color:#22c55e;font-size:12px;"></i> <span>Equivalent to <strong>${treesEq}</strong> tree${treesEq !== 1 ? 's' : ''} offset annually</span>`;
  }

  // ESG
  const esgEl = document.getElementById('biz-esg');
  const esgSubEl = document.getElementById('biz-esg-sub');
  if (esgEl) esgEl.innerHTML = `<span class="${esgClass}">${esgText}</span>`;
  if (esgSubEl) esgSubEl.textContent = esgSub;

  // ESG status badge in KPI card
  const esgBadge = document.getElementById('esg-status-badge');
  if (esgBadge) {
    const col = esgClass === 'biz-status-ok' ? '#22c55e' : (esgClass === 'biz-status-warn' ? '#f59e0b' : '#ef4444');
    esgBadge.innerHTML = `<i class="fa-solid fa-circle-dot" style="font-size:10px;color:${col}"></i> <span>ESG: ${esgText.replace(/^[✓⚠✕]\s/,'')}</span>`;
  }
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
    if (buildings.length > 0) selectBuilding(buildings[0].id);
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
    if (ctxImg)  {
      ctxImg.src = `/static/${b.image}`;
      ctxImg.onerror = function() { this.src = '/static/images/CBRE_Downtown.jpg'; };
    }
  }
  loadSummary(id);
  loadTrend(id, currentDays);
  loadPortfolio();
}

/* ── SUMMARY ────────────────────────────────────────── */
async function loadSummary(buildingId) {
  try {
    const res = await fetch(`${API}/api/summary/${buildingId}`);
    if (!res.ok) throw new Error('No data');
    const data = await res.json();

    // EcoScore KPI
    document.getElementById('score-num') && (document.getElementById('score-num').textContent = data.ecoscore);
    const badge = document.getElementById('grade-badge');
    if (badge) { badge.textContent = data.grade; badge.style.background = data.grade_color; }

    // Gauge
    updateGauge(data.ecoscore, data.grade_color, data.grade);

    // Context bar
    const ctxGrade = document.getElementById('ctx-grade');
    const ctxScoreNum = document.getElementById('ctx-score-num');
    if (ctxGrade) { ctxGrade.textContent = data.grade; ctxGrade.style.background = data.grade_color; }
    if (ctxScoreNum) ctxScoreNum.textContent = data.ecoscore;

    // Carbon
    document.getElementById('kpi-carbon').textContent = data.carbon_footprint;

    // Alerts
    document.getElementById('kpi-alerts').textContent = data.alert_count;
    document.getElementById('kpi-alerts-sub').textContent =
      data.alert_count === 0 ? 'All systems within range' : `${data.alert_count} threshold breach${data.alert_count > 1 ? 'es' : ''} detected`;

    // Stat row
    const l = data.latest;
    document.getElementById('stat-energy').innerHTML = `${l.energy}<span class="stat-mini-unit"> kWh</span>`;
    document.getElementById('stat-hvac').innerHTML   = `${l.hvac}<span class="stat-mini-unit"> %</span>`;
    document.getElementById('stat-temp').innerHTML   = `${l.temperature}<span class="stat-mini-unit"> °C</span>`;
    document.getElementById('stat-waste').innerHTML  = `${l.waste}<span class="stat-mini-unit"> kg</span>`;

    // Business metrics
    renderBusinessMetrics(data);

    renderAlerts(data.alerts);
    renderRecommendations(data.recommendations);

  } catch (e) {
    if (document.getElementById('score-num')) document.getElementById('score-num').textContent = 'N/A';
    if (document.getElementById('kpi-carbon')) document.getElementById('kpi-carbon').textContent = '—';
    if (document.getElementById('kpi-alerts')) document.getElementById('kpi-alerts').textContent = '—';
    renderAlerts([]);
    renderRecommendations([]);
  }
}

function renderAlerts(alerts) {
  const el = document.getElementById('alerts-list');
  if (!alerts || alerts.length === 0) {
    el.innerHTML = `<div class="alert-no-issues"><i class="fa-solid fa-check-circle"></i> No active alerts — all metrics within target range.</div>`;
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
    if (!histRes.ok) { renderForecastSection([]); return; }

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

    lastHistLen = histLen;
    lastForecastLen = forecastLen;

    const datasets = [];

    for (const [key, cfg] of Object.entries(METRIC_CONFIG)) {
      datasets.push({
        label: cfg.label,
        data: [...data.map(d => d[key]), ...Array(forecastLen).fill(null)],
        borderColor: cfg.color,
        backgroundColor: cfg.color + '12',
        borderWidth: 2,
        pointRadius: days <= 7 ? 4 : (days <= 30 ? 2 : 1),
        pointHoverRadius: 5,
        tension: 0.35,
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
        data: [...Array(padLen).fill(null), ...energyAnchor, ...forecastData.map(d => d.energy)],
        borderColor: '#3CA358',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        borderDash: [7, 4],
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
        data: [...Array(padLen).fill(null), ...wasteAnchor, ...forecastData.map(d => d.waste)],
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        borderDash: [7, 4],
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

    // Custom annotation plugin for forecast boundary
    const forecastBoundaryPlugin = {
      id: 'forecastBoundary',
      afterDraw(chart) {
        if (lastForecastLen === 0 || lastHistLen === 0) return;
        const { ctx, scales, chartArea } = chart;
        const xScale = scales.x;
        const boundaryIdx = lastHistLen - 1;
        const xPos = xScale.getPixelForValue(boundaryIdx);

        if (!xPos || isNaN(xPos)) return;

        ctx.save();

        // Shaded forecast zone
        const gradient = ctx.createLinearGradient(xPos, 0, chartArea.right, 0);
        gradient.addColorStop(0, 'rgba(60,163,88,0.06)');
        gradient.addColorStop(1, 'rgba(60,163,88,0.02)');
        ctx.fillStyle = gradient;
        ctx.fillRect(xPos, chartArea.top, chartArea.right - xPos, chartArea.bottom - chartArea.top);

        // Vertical boundary line
        ctx.strokeStyle = 'rgba(60,163,88,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(xPos, chartArea.top);
        ctx.lineTo(xPos, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // "FORECAST →" label
        ctx.fillStyle = 'rgba(60,163,88,0.75)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('FORECAST →', xPos + 6, chartArea.top + 14);

        ctx.restore();
      }
    };

    if (trendChart) {
      trendChart.data.labels = allLabels;
      trendChart.data.datasets = datasets;
      trendChart.update();
    } else {
      const ctx = document.getElementById('trend-chart').getContext('2d');
      trendChart = new Chart(ctx, {
        type: 'line',
        data: { labels: allLabels, datasets },
        plugins: [forecastBoundaryPlugin],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#fff',
              titleColor: '#003F2D',
              bodyColor: '#4d6358',
              borderColor: '#cfddd7',
              borderWidth: 1,
              padding: 12,
              boxShadow: '0 4px 12px rgba(0,63,45,0.1)',
              callbacks: {
                title: (items) => items[0].label,
                label: (item) => {
                  const isForecast = item.dataset.label.includes('Forecast');
                  return ` ${item.dataset.label}: ${item.formattedValue}${isForecast ? ' (projected)' : ''}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: '#f0f4f2' },
              ticks: { color: '#7fa296', font: { size: 10, family: 'Inter' }, maxTicksLimit: 12 }
            },
            y1: {
              type: 'linear', position: 'left',
              grid: { color: '#f0f4f2' },
              ticks: { color: '#3CA358', font: { size: 10 } },
              title: { display: true, text: 'kWh / kg', color: '#7fa296', font: { size: 10 } }
            },
            y2: {
              type: 'linear', position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#003F2D', font: { size: 10 } },
              title: { display: true, text: '%', color: '#7fa296', font: { size: 10 } }
            },
            y3: { type: 'linear', display: false },
            y4: { type: 'linear', display: false }
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
        <div class="forecast-val">
          <span class="forecast-dot" style="background:#3CA358"></span>
          ${f.energy}<span class="forecast-unit">kWh</span>
        </div>
        <div class="forecast-val">
          <span class="forecast-dot" style="background:#ef4444"></span>
          ${f.waste}<span class="forecast-unit">kg</span>
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
    document.getElementById('portfolio-count').textContent =
      `${portfolio.length} propert${portfolio.length !== 1 ? 'ies' : 'y'}`;

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
    document.getElementById('portfolio-grid').innerHTML =
      '<div style="color:var(--text-muted);">Could not load portfolio data.</div>';
  }
}

function switchBuilding(id) {
  const sel = document.getElementById('building-select');
  sel.value = id;
  selectBuilding(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── EXPORT BUTTON ──────────────────────────────────── */
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    exportBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating…';
    exportBtn.disabled = true;
    setTimeout(() => {
      exportBtn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Export Report';
      exportBtn.disabled = false;
      showToast('Sustainability report sent to ubayd.joseph@cbre.com', 'success');
    }, 1800);
  });
}

/* ── METRIC TOGGLES ─────────────────────────────────── */
document.querySelectorAll('.metric-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const metric = btn.dataset.metric;
    if (activeMetrics.has(metric)) {
      if (activeMetrics.size === 1) return;
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
