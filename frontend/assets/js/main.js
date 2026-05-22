/* ============================================
   WATTWISE — main.js  (fixed)
   ============================================ */

/* ── DATA ─────────────────────────────────── */
const DATA = {
  clusterCounts: [3600, 2800, 2200],

  profiles: {
    0: { Usage_kWh: -0.62, Lagging_PF: 0.91,  Leading_PF: -0.23, 'CO2_tCO2': -0.58, NSM:  0.44, Load_Type: -0.71 },
    1: { Usage_kWh: -0.11, Lagging_PF: 0.42,  Leading_PF:  0.68, 'CO2_tCO2': -0.09, NSM:  0.31, Load_Type:  0.22 },
    2: { Usage_kWh:  2.14, Lagging_PF: -0.87, Leading_PF:  0.11, 'CO2_tCO2':  2.05, NSM: -0.18, Load_Type:  1.33 }
  },

  names: {
    0: 'Low Load · Idle Mode',
    1: 'Medium Load · Night Shift',
    2: 'High Load · Day Shift Peak'
  },

  kpis: {
    0: { usage: 4.2,  co2: 0.0015, pf: 86.2 },
    1: { usage: 9.8,  co2: 0.0041, pf: 72.4 },
    2: { usage: 31.4, co2: 0.0138, pf: 58.1 }
  },

  insights: {
    0: 'Cluster ini dominan di hari weekend dengan NSM tinggi, menunjukkan operasional pabrik minimal. Power factor lagging masih bisa dioptimalkan walau beban kecil. CO₂ sangat rendah — jadikan benchmark efisiensi.',
    1: 'Operasional malam hari (NSM menengah). Beban menengah dengan leading power factor cukup seimbang. Risiko: lonjakan beban mendadak saat transisi shift dapat meningkatkan reactive power secara signifikan.',
    2: 'Cluster paling kritis: Usage_kWh dan CO₂ tertinggi, lagging power factor paling buruk. Operasional jam siang (NSM rendah) dengan beban penuh. Setiap 1% perbaikan efisiensi di cluster ini berdampak paling besar.'
  },

  clusterColors: {
    0: { bg: '#EAF3DE', text: '#27500A', accent: '#1D9E75', label: 'Cluster 0' },
    1: { bg: '#E6F1FB', text: '#0C447C', accent: '#378ADD', label: 'Cluster 1' },
    2: { bg: '#FCEBEB', text: '#791F1F', accent: '#E24B4A', label: 'Cluster 2' }
  }
};

/* CBF recommendation rules */
const CBF_RULES = [
  {
    cluster: 0,
    priority: 'medium',
    rule: 'Power Factor Optimization',
    desc: 'Lagging PF di Cluster 0 sudah baik (86.2%), namun masih bisa ditingkatkan ke ≥90% dengan capacitor bank kecil.',
    gap: '−3.8 pp dari target'
  },
  {
    cluster: 0,
    priority: 'medium',
    rule: 'Kurangi Beban Standby',
    desc: 'Idle equipment tetap menarik daya reaktif. Matikan peralatan non-esensial saat tidak ada produksi.',
    gap: 'Est. −12% kVarh'
  },
  {
    cluster: 0,
    priority: 'medium',
    rule: 'Jadwalkan Preventive Maintenance',
    desc: 'NSM tinggi menandakan banyak waktu off-peak — manfaatkan untuk maintenance tanpa mengganggu produksi.',
    gap: 'Availability ↑'
  },
  {
    cluster: 1,
    priority: 'high',
    rule: 'Load Shifting ke Off-Peak',
    desc: 'Shift beban besar ke jam 22.00–05.00 untuk memanfaatkan tarif listrik lebih rendah dan mengurangi peak demand.',
    gap: 'Est. −15–25% biaya'
  },
  {
    cluster: 1,
    priority: 'high',
    rule: 'Monitor Reaktif Lagging',
    desc: 'Reactive power lagging menengah (28.1 kVarh) dapat memburuk jika beban meningkat. Pasang monitoring real-time.',
    gap: 'PF: 72.4% → target 85%'
  },
  {
    cluster: 1,
    priority: 'medium',
    rule: 'Optimalkan Timer Otomatis',
    desc: 'Gunakan smart timer pada beban besar (kompresor, pompa) agar tidak berjalan saat tidak diperlukan selama night shift.',
    gap: 'Est. −10% Usage_kWh'
  },
  {
    cluster: 2,
    priority: 'critical',
    rule: 'Audit Energi Menyeluruh (URGENT)',
    desc: 'Cluster 2 mengonsumsi 31.4 kWh rata-rata — 7.5× lebih besar dari Cluster 0. Audit segera untuk identifikasi pemborosan terbesar.',
    gap: '−27.2 kWh vs ideal'
  },
  {
    cluster: 2,
    priority: 'critical',
    rule: 'Instalasi Capacitor Bank',
    desc: 'Lagging PF hanya 58.1% — jauh di bawah batas PLN 85%. Risiko denda dan efisiensi rendah. Prioritas instalasi capacitor bank.',
    gap: 'PF: 58.1% → target 85%'
  },
  {
    cluster: 2,
    priority: 'critical',
    rule: 'Peak Shaving & Demand Management',
    desc: 'Beban puncak siang hari (NSM rendah) menyebabkan demand charge tinggi. Implementasi peak shaving system untuk memangkas lonjakan.',
    gap: 'CO₂: 0.0138 tCO₂ avg'
  },
  {
    cluster: 2,
    priority: 'high',
    rule: 'Ganti Peralatan Tidak Efisien',
    desc: 'Evaluasi mesin-mesin berusia >10 tahun yang berkontribusi pada konsumsi tinggi. Pertimbangkan upgrade ke motor IE3/IE4.',
    gap: 'Est. −20–30% kWh'
  }
];

/* Bar chart datasets */
const BAR_DATA = {
  kwh: {
    label: 'Avg Usage (kWh)',
    data: [4.2, 9.8, 31.4],
    colors: ['#1D9E75', '#378ADD', '#E24B4A']
  },
  co2: {
    label: 'Avg CO₂ (tCO₂ × 1000)',
    data: [1.5, 4.1, 13.8],
    colors: ['#1D9E75', '#378ADD', '#E24B4A']
  },
  pf: {
    label: 'Lagging Power Factor (%)',
    data: [86.2, 72.4, 58.1],
    colors: ['#1D9E75', '#378ADD', '#E24B4A']
  }
};

/* ── CHART INSTANCES ─────────────────────── */
let radarChart = null;
let barChart   = null;
let pieChart   = null;

/* ── PAGE SWITCHING ──────────────────────── */
window.switchPage = function (pageId, sidebarBtn) {
  /* pages */
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  /* sidebar buttons */
  if (sidebarBtn) {
    document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
    sidebarBtn.classList.add('active');
  }

  /* sync sidebar active state even when called from nav-tabs */
  const sbMap = { dashboard: 0, segmentasi: 1, rekomendasi: 2, perbandingan: 3 };
  const sbItems = document.querySelectorAll('.sb-nav .sb-item');
  if (sbMap[pageId] !== undefined && sbItems[sbMap[pageId]]) {
    sbItems.forEach(b => b.classList.remove('active'));
    sbItems[sbMap[pageId]].classList.add('active');
  }

  /* lazy-init charts when their page first becomes visible */
  if (pageId === 'segmentasi' && !radarChart) initRadarChart();
  if (pageId === 'perbandingan' && !pieChart) initPieChart();
};

window.switchNavTab = function (btn) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

/* ── INIT ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initBarChart('kwh');
  initDetailContent(0);
  renderRecGrid(null); /* all clusters */
  syncNavTabsWithPages();
});

/* keep nav-tab highlight in sync with sidebar clicks */
function syncNavTabsWithPages() {
  const order = ['dashboard', 'segmentasi', 'rekomendasi', 'perbandingan'];
  document.querySelectorAll('.sb-nav .sb-item').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const tabs = document.querySelectorAll('.nav-tab');
      tabs.forEach(t => t.classList.remove('active'));
      if (tabs[i]) tabs[i].classList.add('active');
    });
  });
}

/* ── BAR CHART (Dashboard) ───────────────── */
function initBarChart(type) {
  const ctx = document.getElementById('barMain');
  if (!ctx) return;

  const d = BAR_DATA[type];
  const gradient = (ctx2d, color) => {
    const g = ctx2d.createLinearGradient(0, 0, 0, 210);
    g.addColorStop(0, color);
    g.addColorStop(1, color + '55');
    return g;
  };

  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Cluster 0', 'Cluster 1', 'Cluster 2'],
      datasets: [{
        label: d.label,
        data: d.data,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return d.colors[context.dataIndex];
          return gradient(c, d.colors[context.dataIndex]);
        },
        borderColor: d.colors,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9A9994', font: { family: 'DM Sans', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
          ticks: { color: '#9A9994', font: { family: 'DM Sans', size: 10 } },
          border: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1A1917',
          titleFont: { family: 'DM Sans', size: 12 },
          bodyFont: { family: 'DM Mono', size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.raw} ${d.label}`
          }
        }
      }
    }
  });
}

window.switchBarChart = function (type, btn) {
  document.querySelectorAll('.tg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  initBarChart(type);
};

/* ── RADAR CHART (Segmentasi) ────────────── */
function initRadarChart() {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;

  const labels = ['Usage kWh', 'Lagging PF', 'Leading PF', 'CO₂', 'NSM', 'Load Type'];
  const keys   = ['Usage_kWh', 'Lagging_PF', 'Leading_PF', 'CO2_tCO2', 'NSM', 'Load_Type'];

  const palette = [
    { border: '#1D9E75', bg: 'rgba(29,158,117,0.12)' },
    { border: '#378ADD', bg: 'rgba(55,138,221,0.12)'  },
    { border: '#E24B4A', bg: 'rgba(226,75,74,0.12)'   }
  ];

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [0, 1, 2].map(i => ({
        label: `Cluster ${i}`,
        data: keys.map(k => DATA.profiles[i][k]),
        borderColor: palette[i].border,
        backgroundColor: palette[i].bg,
        borderWidth: 2,
        pointRadius: 3.5,
        pointBackgroundColor: palette[i].border,
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      scales: {
        r: {
          grid: { color: 'rgba(0,0,0,0.07)' },
          angleLines: { color: 'rgba(0,0,0,0.07)' },
          ticks: {
            color: '#9A9994',
            backdropColor: 'transparent',
            font: { family: 'DM Mono', size: 9 },
            stepSize: 0.5
          },
          pointLabels: {
            color: '#6B6A65',
            font: { family: 'DM Sans', size: 11 }
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/* ── PIE CHART (Perbandingan) ────────────── */
function initPieChart() {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cluster 0 — Low Load', 'Cluster 1 — Medium', 'Cluster 2 — High Load'],
      datasets: [{
        data: [42, 33, 25],
        backgroundColor: ['#1D9E75', '#378ADD', '#E24B4A'],
        borderColor: '#FFFFFF',
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1A1917',
          titleFont: { family: 'DM Sans', size: 12 },
          bodyFont: { family: 'DM Mono', size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.raw}% dari total records`
          }
        }
      }
    }
  });
}

/* ── DETAIL CLUSTER (Segmentasi tab) ─────── */
window.switchDetail = function (idx, btn) {
  document.querySelectorAll('.dtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  initDetailContent(idx);
};

function initDetailContent(idx) {
  const el = document.getElementById('detailContent');
  if (!el) return;

  const kpi = DATA.kpis[idx];
  const col = DATA.clusterColors[idx];

  const recForCluster = CBF_RULES.filter(r => r.cluster === idx);

  const prioLabel = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang' };
  const prioClass = { critical: 'prio-critical', high: 'prio-high', medium: 'prio-medium' };

  const recHTML = recForCluster.map(r => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:4px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${r.rule}</span>
        <span class="kpi-badge-sm ${prioClass[r.priority]}">${prioLabel[r.priority]}</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);line-height:1.5">${r.desc}</div>
      <div style="font-size:11px;font-family:'DM Mono',monospace;color:${col.accent}">${r.gap}</div>
    </div>
  `).join('');

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div style="padding:10px 12px;background:${col.bg};border-radius:var(--radius-sm);text-align:center">
          <div style="font-size:10px;font-weight:600;color:${col.text};margin-bottom:4px">USAGE AVG</div>
          <div style="font-size:18px;font-weight:600;color:${col.accent}">${kpi.usage}<span style="font-size:11px;font-weight:400;color:${col.text}"> kWh</span></div>
        </div>
        <div style="padding:10px 12px;background:${col.bg};border-radius:var(--radius-sm);text-align:center">
          <div style="font-size:10px;font-weight:600;color:${col.text};margin-bottom:4px">CO₂ AVG</div>
          <div style="font-size:18px;font-weight:600;color:${col.accent}">${kpi.co2}<span style="font-size:11px;font-weight:400;color:${col.text}"> tCO₂</span></div>
        </div>
        <div style="padding:10px 12px;background:${col.bg};border-radius:var(--radius-sm);text-align:center">
          <div style="font-size:10px;font-weight:600;color:${col.text};margin-bottom:4px">LAGGING PF</div>
          <div style="font-size:18px;font-weight:600;color:${col.accent}">${kpi.pf}<span style="font-size:11px;font-weight:400;color:${col.text}">%</span></div>
        </div>
      </div>

      <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm)">
        ${DATA.insights[idx]}
      </div>

      <div style="font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:0.07em;text-transform:uppercase;margin-top:4px">
        Rekomendasi Tindakan
      </div>
      ${recHTML}
    </div>
  `;
}

/* ── REC GRID (Rekomendasi page) ─────────── */
window.switchRecCluster = function (filterIdx, btn) {
  /* filterIdx: 0 = semua, 1 = C0, 2 = C1, 3 = C2 */
  document.querySelectorAll('#page-rekomendasi .dtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const clusterFilter = filterIdx === 0 ? null : filterIdx - 1;
  renderRecGrid(clusterFilter);
};

function renderRecGrid(clusterFilter) {
  const grid = document.getElementById('recGrid');
  if (!grid) return;

  const rules = clusterFilter === null
    ? CBF_RULES
    : CBF_RULES.filter(r => r.cluster === clusterFilter);

  const prioClass = { critical: 'prio-critical', high: 'prio-high', medium: 'prio-medium' };
  const prioLabel = { critical: 'Kritis',         high: 'Tinggi',   medium: 'Sedang'  };

  const clsBg = { 0: '#EAF3DE', 1: '#E6F1FB', 2: '#FCEBEB' };
  const clsTx = { 0: '#27500A', 1: '#0C447C', 2: '#791F1F' };

  grid.innerHTML = rules.map(r => `
    <div class="rec-card">
      <div class="rc-top">
        <span class="rc-cluster" style="background:${clsBg[r.cluster]};color:${clsTx[r.cluster]}">
          Cluster ${r.cluster}
        </span>
        <span class="rc-prio ${prioClass[r.priority]}">${prioLabel[r.priority]}</span>
      </div>
      <div class="rc-rule">${r.rule}</div>
      <div class="rc-desc">${r.desc}</div>
      <div class="rc-gap">
        <i class="ti ti-trending-down" aria-hidden="true"></i>
        <span class="rc-gap-val">${r.gap}</span>
      </div>
    </div>
  `).join('');
<<<<<<< HEAD
}
=======
}
>>>>>>> 58d618f (membenarkan modelling)
