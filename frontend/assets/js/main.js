/* ============================================
   STEEL ENERGY INTEL — main.js
   ============================================ */

const DATA = {
  clusterCounts: [3600, 2800, 2200],

  profiles: {
    0: {
      'Usage_kWh': -0.42, 'Lagging_Current_Reactive.Power_kVarh': -0.38,
      'Leading_Current_Reactive_Power_kVarh': 0.12, 'CO2(tCO2)': -0.41,
      'Lagging_Current_Power_Factor': 0.31, 'Leading_Current_Power_Factor': 0.45,
      'NSM': -0.18, 'hour': -0.22
    },
    1: {
      'Usage_kWh': 0.18, 'Lagging_Current_Reactive.Power_kVarh': 0.21,
      'Leading_Current_Reactive_Power_kVarh': -0.08, 'CO2(tCO2)': 0.17,
      'Lagging_Current_Power_Factor': -0.12, 'Leading_Current_Power_Factor': 0.09,
      'NSM': -0.55, 'hour': -0.48
    },
    2: {
      'Usage_kWh': 1.21, 'Lagging_Current_Reactive.Power_kVarh': 1.08,
      'Leading_Current_Reactive_Power_kVarh': -0.14, 'CO2(tCO2)': 1.19,
      'Lagging_Current_Power_Factor': -0.58, 'Leading_Current_Power_Factor': -0.31,
      'NSM': 0.82, 'hour': 0.68
    }
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
    0: 'Cluster ini dominan di hari weekend dengan NSM rendah, menunjukkan operasional pabrik minimal. Power factor lagging masih bisa dioptimalkan walau beban kecil. CO₂ sangat rendah — jadikan benchmark efisiensi.',
    1: 'Operasional malam hari (NSM negatif = jam awal hari). Beban menengah dengan leading power factor cukup seimbang. Risiko: lonjakan beban mendadak saat transisi shift dapat meningkatkan reactive power secara signifikan.',
    2: 'Cluster paling kritis: Usage_kWh dan CO₂ tertinggi, lagging power factor paling buruk (-0.58). Operasional jam siang (NSM tinggi) dengan beban penuh. Setiap 1% perbaikan efisiensi di cluster ini berdampak paling besar.'
  },

  recommendations: {
    0: [
      'Pertahankan pola konsumsi energi saat ini — cluster ini sudah efisien',
      'Optimalkan power factor untuk mengurangi daya reaktif yang tersisa',
      'Jadwalkan maintenance preventif pada periode idle ini',
      'Kurangi konsumsi standby equipment yang tidak aktif'
    ],
    1: [
      'Monitor lonjakan beban secara berkala menggunakan sistem SCADA',
      'Lakukan load shifting ke jam off-peak untuk menghemat biaya listrik',
      'Optimalkan penggunaan energi saat night shift dengan timer otomatis',
      'Lakukan predictive maintenance sebelum shift pagi dimulai'
    ],
    2: [
      'Prioritaskan audit energi menyeluruh — konsumsi tertinggi di semua cluster',
      'Pasang capacitor bank untuk memperbaiki lagging power factor yang buruk',
      'Evaluasi dan ganti peralatan berdaya besar dengan yang lebih efisien',
      'Implementasikan peak shaving untuk mengurangi biaya demand charge'
    ]
  },

  actions: {
    0: [
      { icon: '✅', text: 'Standarisasi SOP operasional idle' },
      { icon: '🔧', text: 'Jadwal PM rutin bulanan' },
      { icon: '📊', text: 'Monitoring power factor mingguan' }
    ],
    1: [
      { icon: '⚡', text: 'Pasang timer otomatis beban besar' },
      { icon: '📅', text: 'Review jadwal load shifting' },
      { icon: '🔍', text: 'Audit reaktansi induktif mesin' }
    ],
    2: [
      { icon: '🚨', text: 'Audit energi segera (URGENT)' },
      { icon: '🏭', text: 'Instalasi capacitor bank' },
      { icon: '📈', text: 'Implementasi peak shaving system' }
    ]
  },

  tableInterpretations: [
    'Konsumsi energi aktif — tertinggi di Cluster 2',
    'Daya reaktif lagging — masalah utama Cluster 2',
    'Daya reaktif leading — paling tinggi di Cluster 0',
    'Emisi karbon — mengikuti pola Usage_kWh',
    'Power factor lagging — semakin tinggi semakin baik',
    'Power factor leading — terbaik di Cluster 0',
    'Waktu dalam hari (detik) — Cluster 2 paling siang',
    'Jam operasional — Cluster 2 dominan siang hari'
  ]
};

const RULES = [
  { label: 'Usage tinggi vs ideal',         pct: 87 },
  { label: 'Lagging PF rendah',             pct: 74 },
  { label: 'CO₂ melebihi threshold',        pct: 68 },
  { label: 'Reactive power lagging tinggi', pct: 61 },
  { label: 'Leading PF tidak optimal',      pct: 43 },
  { label: 'Konsumsi non-peak berlebih',    pct: 38 },
  { label: 'Beban reaktif tidak seimbang',  pct: 29 },
  { label: 'NSM vs shift mismatch',         pct: 21 }
];

const C = { g: '#2d7a4f', a: '#c8882a', r: '#b84040' };

let radarChart = null;
let barChart   = null;

// ================================================
// LOAD CHART.JS
// ================================================
function loadChartJS(cb) {
  if (window.Chart) return cb();
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// ================================================
// INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  loadChartJS(() => {
    animateKPIs();
    buildComparisonTable();
    buildRuleBars();
    buildCharts();
    switchCluster(0);
    switchRec(0);
  });
});

// ================================================
// KPI BARS
// ================================================
function animateKPIs() {
  const total = DATA.clusterCounts.reduce((a, b) => a + b, 0);
  setTimeout(() => {
    [0, 1, 2].forEach(i => {
      const pct = (DATA.clusterCounts[i] / total * 100).toFixed(1);
      document.getElementById('kf' + i).style.width = pct + '%';
    });
  }, 400);
}

// ================================================
// CLUSTER TABS
// ================================================
window.switchCluster = function(idx) {
  document.querySelectorAll('.ctab').forEach((el, i) => el.classList.toggle('active', i === idx));
  renderClusterDetail(idx);
  updateRadar(idx);
};

function renderClusterDetail(idx) {
  const kpi = DATA.kpis[idx];
  const colors = [C.g, C.a, C.r];
  document.getElementById('clusterDetail').innerHTML = `
    <div class="cd-block">
      <div class="cd-label">NAMA CLUSTER</div>
      <div class="cd-value" style="color:${colors[idx]};font-weight:600">Cluster ${idx} — ${DATA.names[idx]}</div>
    </div>
    <div class="cd-block">
      <div class="cd-label">METRIK UTAMA</div>
      <div class="cd-value mono">${kpi.usage} kWh avg · CO₂ ${kpi.co2} tCO₂ · PF ${kpi.pf}%</div>
    </div>
    <div class="cd-block">
      <div class="cd-label">INSIGHT</div>
      <div class="cd-value" style="font-size:13px">${DATA.insights[idx]}</div>
    </div>
  `;
}

// ================================================
// COMPARISON TABLE
// ================================================
function buildComparisonTable() {
  const features = [
    { key: 'Usage_kWh',                            label: 'Usage (kWh)'           },
    { key: 'Lagging_Current_Reactive.Power_kVarh', label: 'Lag Reactive (kVarh)'  },
    { key: 'Leading_Current_Reactive_Power_kVarh', label: 'Lead Reactive (kVarh)' },
    { key: 'CO2(tCO2)',                             label: 'CO₂ (tCO₂)'           },
    { key: 'Lagging_Current_Power_Factor',          label: 'Lagging PF'           },
    { key: 'Leading_Current_Power_Factor',          label: 'Leading PF'           },
    { key: 'NSM',                                   label: 'NSM (detik)'          },
    { key: 'hour',                                  label: 'Hour of Day'          }
  ];

  const tbody = document.getElementById('ctbody');
  tbody.innerHTML = '';
  const clrs = [C.g, C.a, C.r];

  features.forEach((f, fi) => {
    const vals  = [0, 1, 2].map(i => DATA.profiles[i][f.key]);
    const maxV  = Math.max(...vals);
    const minV  = Math.min(...vals);
    const range = maxV - minV || 1;

    const tr = document.createElement('tr');
    let html = `<td class="feat-name">${f.label}</td>`;

    for (let i = 0; i < 3; i++) {
      const v    = vals[i];
      const isMax = v === maxV;
      const barW  = Math.max(((v - minV) / range) * 64, 4);
      html += `
        <td class="val-${i}${isMax ? ' highest' : ''}">
          <div class="mini-bar-wrap">
            <div class="mini-bar" style="background:${clrs[i]};width:${barW}px;opacity:0.7"></div>
            <span>${v >= 0 ? '+' : ''}${v.toFixed(2)}</span>
          </div>
        </td>`;
    }

    html += `<td class="interp">${DATA.tableInterpretations[fi]}</td>`;
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

// ================================================
// RULE BARS
// ================================================
function buildRuleBars() {
  const container = document.getElementById('ruleBars');
  container.innerHTML = '';

  RULES.forEach((rule, i) => {
    const div = document.createElement('div');
    div.className = 'rule-bar-item';
    div.innerHTML = `
      <div class="rb-label">${rule.label}</div>
      <div class="rb-val">${rule.pct}%</div>
      <div class="rb-track"><div class="rb-fill" id="rbf${i}"></div></div>
    `;
    container.appendChild(div);
  });

  setTimeout(() => {
    RULES.forEach((rule, i) => {
      const el = document.getElementById('rbf' + i);
      if (el) el.style.width = rule.pct + '%';
    });
  }, 700);
}

// ================================================
// CHARTS
// ================================================
function buildCharts() {
  buildRadarChart(0);
  buildBarChart();
}

function buildRadarChart(activeIdx) {
  const ctx  = document.getElementById('radarChart').getContext('2d');
  const keys = ['Usage_kWh', 'Lagging_Current_Reactive.Power_kVarh',
                 'Leading_Current_Reactive_Power_kVarh', 'CO2(tCO2)',
                 'Lagging_Current_Power_Factor', 'Leading_Current_Power_Factor', 'NSM'];
  const labels = ['Usage', 'Lag Reactive', 'Lead Reactive', 'CO₂', 'Lag PF', 'Lead PF', 'NSM'];

  const clrs = [
    { border: C.g, bg: 'rgba(45,122,79,0.12)' },
    { border: C.a, bg: 'rgba(200,136,42,0.12)' },
    { border: C.r, bg: 'rgba(184,64,64,0.12)' }
  ];

  const datasets = [0, 1, 2].map(i => ({
    label: `Cluster ${i}`,
    data: keys.map(k => DATA.profiles[i][k]),
    borderColor: clrs[i].border,
    backgroundColor: clrs[i].bg,
    borderWidth: i === activeIdx ? 2.5 : 1.2,
    pointRadius: i === activeIdx ? 4 : 2.5,
    pointBackgroundColor: clrs[i].border,
  }));

  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      animation: { duration: 600 },
      scales: {
        r: {
          beginAtZero: false,
          grid: { color: 'rgba(0,0,0,0.06)' },
          angleLines: { color: 'rgba(0,0,0,0.06)' },
          ticks: { color: '#7a8070', backdropColor: 'transparent', font: { family: 'Geist Mono', size: 9 } },
          pointLabels: { color: '#3d4237', font: { family: 'DM Sans', size: 11 } }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#3d4237', font: { family: 'DM Sans', size: 11 }, boxWidth: 10, padding: 14 }
        }
      }
    }
  });
}

function updateRadar(idx) {
  if (!radarChart) return;
  radarChart.data.datasets.forEach((ds, i) => {
    ds.borderWidth = i === idx ? 2.5 : 1.2;
    ds.pointRadius = i === idx ? 4 : 2.5;
  });
  radarChart.update('active');
}

function buildBarChart() {
  const ctx   = document.getElementById('barChart').getContext('2d');
  const total = DATA.clusterCounts.reduce((a, b) => a + b, 0);
  const pcts  = DATA.clusterCounts.map(c => parseFloat((c / total * 100).toFixed(1)));

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Cluster 0 — Low Load', 'Cluster 1 — Medium', 'Cluster 2 — High Load'],
      datasets: [{
        data: pcts,
        backgroundColor: [`${C.g}cc`, `${C.a}cc`, `${C.r}cc`],
        borderColor:      [C.g, C.a, C.r],
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 900 },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#7a8070', font: { family: 'DM Sans', size: 11 }, maxRotation: 0 } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#7a8070', font: { family: 'Geist Mono', size: 10 }, callback: v => v + '%' } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.raw}% — ${DATA.clusterCounts[ctx.dataIndex].toLocaleString()} records` },
          bodyFont: { family: 'Geist Mono', size: 11 },
          backgroundColor: '#1a1d16', borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1
        }
      }
    }
  });
}

// ================================================
// RECOMMENDATIONS
// ================================================
window.switchRec = function(idx) {
  document.querySelectorAll('.rtab').forEach((el, i) => el.classList.toggle('active', i === idx));
  renderRecCards(idx);
};

function renderRecCards(idx) {
  const container = document.getElementById('recCards');
  container.innerHTML = '';

  DATA.recommendations[idx].forEach((rec, i) => {
    const div = document.createElement('div');
    div.className = 'rec-card';
    div.style.animationDelay = `${i * 55}ms`;
    div.innerHTML = `<div class="rc-num">0${i + 1}</div><div class="rc-text">${rec}</div>`;
    container.appendChild(div);
  });

  const insight = document.createElement('div');
  insight.className = 'rec-card insight-card';
  insight.style.animationDelay = '240ms';
  insight.innerHTML = `
    <div style="width:100%">
      <div class="ic-label">💡 INSIGHT KONTEKSTUAL</div>
      <div class="ic-text">${DATA.insights[idx]}</div>
    </div>
  `;
  container.appendChild(insight);

  const action = document.createElement('div');
  action.className = 'rec-card action-card';
  action.style.animationDelay = '300ms';
  const items = DATA.actions[idx].map(a =>
    `<div class="ac-item"><span class="ac-icon">${a.icon}</span><span>${a.text}</span></div>`
  ).join('');
  action.innerHTML = `
    <div style="width:100%">
      <div class="ac-label">PRIORITAS TINDAKAN</div>
      <div class="ac-items">${items}</div>
    </div>
  `;
  container.appendChild(action);
}