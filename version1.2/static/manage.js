/* EcoManage — manage.js */

const API = '';

let buildings = [];

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

/* ── LOAD BUILDINGS ─────────────────────────────────── */
async function fetchBuildings() {
  try {
    const res = await fetch(`${API}/buildings`);
    buildings = await res.json();
    populateBuildingDropdown();
    renderBuildingsTable();
  } catch (e) {
    showToast('Could not load buildings', 'error');
  }
}

function populateBuildingDropdown() {
  const sel = document.getElementById('dataBuilding');
  sel.innerHTML = '<option value="">Select building…</option>';
  buildings.forEach(b => {
    const o = document.createElement('option');
    o.value = b.id;
    o.textContent = b.name;
    sel.appendChild(o);
  });
}

function renderBuildingsTable() {
  const wrap = document.getElementById('buildings-table-wrap');
  if (buildings.length === 0) {
    wrap.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">No buildings registered yet.</div>';
    return;
  }
  wrap.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
          <th style="padding:10px 12px;text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">#</th>
          <th style="padding:10px 12px;text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Name</th>
          <th style="padding:10px 12px;text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Address</th>
        </tr>
      </thead>
      <tbody>
        ${buildings.map(b => `
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:10px 12px;color:var(--text-muted);">${b.id}</td>
            <td style="padding:10px 12px;font-weight:600;color:var(--cbre-dark);">${b.name}</td>
            <td style="padding:10px 12px;color:var(--text-secondary);">${b.address}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ── ADD BUILDING ───────────────────────────────────── */
document.getElementById('add-building-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('buildingName').value.trim();
  const address = document.getElementById('buildingAddress').value.trim();
  if (!name || !address) return;

  try {
    const res = await fetch(`${API}/buildings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address })
    });
    if (!res.ok) throw new Error('Failed');
    showToast(`"${name}" registered successfully!`);
    e.target.reset();
    await fetchBuildings();
  } catch (err) {
    showToast('Failed to register building — please try again.', 'error');
  }
});

/* ── ADD DAILY DATA ─────────────────────────────────── */
document.getElementById('daily-data-form').addEventListener('submit', async e => {
  e.preventDefault();
  const buildingId = document.getElementById('dataBuilding').value;
  const date = document.getElementById('dataDate').value;
  const energy = parseFloat(document.getElementById('energyData').value);
  const hvac = parseFloat(document.getElementById('hvacData').value);
  const temperature = parseFloat(document.getElementById('temperatureData').value);
  const waste = parseFloat(document.getElementById('wasteData').value);

  if (!buildingId || !date) return;

  try {
    const res = await fetch(`${API}/data/${buildingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, energy, hvac, temperature, waste })
    });
    if (!res.ok) throw new Error('Failed');
    showToast('Daily metrics saved successfully!');
    e.target.reset();
    // reset date to today
    document.getElementById('dataDate').valueAsDate = new Date();
  } catch (err) {
    showToast('Failed to save data — please try again.', 'error');
  }
});

/* ── INIT ───────────────────────────────────────────── */
document.getElementById('dataDate').valueAsDate = new Date();
fetchBuildings();
