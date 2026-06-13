/* ══════════════════════════════════════════════════════
   DATA — single source of truth
══════════════════════════════════════════════════════ */
const DATA = {
  clusterCounts: [3600, 2800, 2200],

  profiles: {
    0: { Usage_kWh: -0.62, Lagging_PF: 0.91, Leading_PF: -0.23, 'CO2_tCO2': -0.58, NSM: 0.44, Load_Type: -0.71 },
    1: { Usage_kWh: -0.11, Lagging_PF: 0.42, Leading_PF: 0.68, 'CO2_tCO2': -0.09, NSM: 0.31, Load_Type: 0.22 },
    2: { Usage_kWh: 2.14, Lagging_PF: -0.87, Leading_PF: 0.11, 'CO2_tCO2': 2.05, NSM: -0.18, Load_Type: 1.33 }
  },

  names: {
    0: 'Low Load · Idle Mode',
    1: 'Medium Load · Night Shift',
    2: 'High Load · Day Shift Peak'
  },

  kpis: {
    0: { usage: 4.2, co2: 0.0015, pf: 86.2 },
    1: { usage: 9.8, co2: 0.0041, pf: 72.4 },
    2: { usage: 31.4, co2: 0.0138, pf: 58.1 }
  },

  insights: {
    0: 'Cluster ini dominan di hari weekend dengan NSM tinggi, menunjukkan operasional pabrik minimal. Power factor lagging masih bisa dioptimalkan walau beban kecil. CO₂ sangat rendah — jadikan benchmark efisiensi.',
    1: 'Operasional malam hari (NSM menengah). Beban menengah dengan leading power factor cukup seimbang. Risiko: lonjakan beban mendadak saat transisi shift dapat meningkatkan reactive power secara signifikan.',
    2: 'Cluster paling kritis: Usage_kWh dan CO₂ tertinggi, lagging power factor paling buruk. Operasional jam siang (NSM rendah) dengan beban penuh. Setiap 1% perbaikan efisiensi di cluster ini berdampak paling besar.'
  },

  clusterColors: {
    0: { bg: '#ECFDF5', text: '#065F46', accent: '#059669', label: 'Cluster 0' },
    1: { bg: '#EFF6FF', text: '#1E40AF', accent: '#2563EB', label: 'Cluster 1' },
    2: { bg: '#FEF2F2', text: '#991B1B', accent: '#DC2626', label: 'Cluster 2' }
  }
};

const PRIO_LABEL = { critical: '🚨 Kritis', high: '⚡ Tinggi', medium: '💡 Sedang' };
const PRIO_CLASS = { critical: 'prio-critical', high: 'prio-high', medium: 'prio-medium' };

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

const BAR_DATA = {
  kwh: {
    label: 'Avg Usage (kWh)',
    data: [4.2, 9.8, 31.4],
    colors: ['#38BDF8', '#818CF8', '#A78BFA']
  },
  co2: {
    label: 'Avg CO₂ (kgCO₂)',
    data: [1.5, 4.1, 13.8],
    colors: ['#38BDF8', '#818CF8', '#A78BFA']
  },
  pf: {
    label: 'Lagging Power Factor (%)',
    data: [86.2, 72.4, 58.1],
    colors: ['#38BDF8', '#818CF8', '#A78BFA']
  }
};

let radarChart = null;
let barChart = null;
let pieChart = null;
let areaChart = null;
let radarDashChart = null;

/* ══════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════ */
window.enterDashboard = function () {
  const overlay = document.getElementById('landingOverlay');
  const shell = document.getElementById('appShell');

  overlay.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  overlay.style.opacity = '0';
  overlay.style.transform = 'scale(1.02)';

  setTimeout(() => {
    overlay.style.display = 'none';
    shell.style.display = 'flex';
    shell.style.opacity = '0';
    shell.style.transition = 'opacity 0.45s ease';
    shell.style.height = '100vh';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        shell.style.opacity = '1';
      });
    });

    // Init charts after shell is visible
    setTimeout(() => {
      initBarChart('kwh');
      initAreaChart();
      initRadarDashChart();
      initDetailContent(0);
      renderRecGrid(null);
      renderTimeHeatmap();
      syncNavTabsWithPages();
    }, 100);
  }, 480);
};

window.returnToLanding = function () {
  const overlay = document.getElementById('landingOverlay');
  const shell = document.getElementById('appShell');

  shell.style.transition = 'opacity 0.4s ease';
  shell.style.opacity = '0';

  setTimeout(() => {
    shell.style.display = 'none';
    overlay.style.display = 'flex';
    overlay.style.transform = 'scale(0.98)';
    overlay.style.opacity = '0';
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        overlay.style.opacity = '1';
        overlay.style.transform = 'scale(1)';
      });
    });
  }, 400);
};

// Allow scrolling down to enter dashboard
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('landingOverlay');
  if (overlay) {
    overlay.addEventListener('wheel', (e) => {
      if (e.deltaY > 20 && overlay.style.display !== 'none') {
        enterDashboard();
      }
    });

    let touchstartY = 0;
    overlay.addEventListener('touchstart', e => {
      touchstartY = e.changedTouches[0].screenY;
    }, {passive: true});
    
    overlay.addEventListener('touchend', e => {
      if (touchstartY - e.changedTouches[0].screenY > 40 && overlay.style.display !== 'none') {
        enterDashboard();
      }
    });
  }
});

/* ══════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════ */
window.openModal = function () {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeModal = function () {
  const overlay = document.getElementById('modalOverlay');
  overlay.style.animation = 'fadeIn 0.18s ease reverse';
  setTimeout(() => {
    overlay.classList.remove('open');
    overlay.style.animation = '';
    document.body.style.overflow = '';
  }, 160);
};

window.closeModalOutside = function (e) {
  if (e.target === document.getElementById('modalOverlay')) {
    closeModal();
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    if(typeof closePredictModal === 'function') closePredictModal();
  }
});

/* ══════════════════════════════════════════════════════
   PREDICT MODAL & FETCH LOGIC
══════════════════════════════════════════════════════ */
window.openPredictModal = function () {
  const overlay = document.getElementById('predictModalOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closePredictModal = function () {
  const overlay = document.getElementById('predictModalOverlay');
  overlay.style.animation = 'fadeIn 0.18s ease reverse';
  setTimeout(() => {
    overlay.classList.remove('open');
    overlay.style.animation = '';
    document.body.style.overflow = '';
  }, 160);
};

window.closePredictModalOutside = function (e) {
  if (e.target === document.getElementById('predictModalOverlay')) {
    closePredictModal();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('predictForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = document.getElementById('predictSubmitBtn');
      const resultDiv = document.getElementById('predictResult');
      const originalBtnText = btn.innerHTML;
      
      btn.innerHTML = '<span>Memproses ML...</span> <i class="ti ti-loader" style="animation: spin 1s linear infinite"></i>';
      btn.disabled = true;
      resultDiv.style.display = 'none';

      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = parseFloat(value) || 0;
      });

      try {
        const response = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const res = await response.json();
        
        if (res.status === 'success') {
          let rulesHtml = '';
          if (res.rules_applied && res.rules_applied.length > 0) {
            rulesHtml = '<ul style="margin: 10px 0 0 20px; font-size: 13px; color: var(--text-secondary);">';
            res.rules_applied.forEach(r => {
              rulesHtml += `<li><b>${r.feature}</b> (Prioritas: ${r.priority})</li>`;
            });
            rulesHtml += '</ul>';
          } else {
            rulesHtml = '<p style="font-size: 13px; color: var(--text-muted);">Tidak ada rekomendasi khusus.</p>';
          }

          resultDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 8px;">
              <div style="background:var(--green); color:white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">BERHASIL</div>
              <div style="font-size: 16px; font-weight: bold; color: var(--text-primary);">Hasil Prediksi: ${res.cluster_name}</div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">ID Cluster: ${res.cluster_id}</div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">Rekomendasi Tindakan:</div>
            ${rulesHtml}
          `;
        } else {
          resultDiv.innerHTML = `<div style="color: var(--red); font-weight: bold;">Error: ${res.message}</div>`;
        }
      } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--red); font-weight: bold;">Koneksi gagal. Pastikan API backend berjalan di localhost:5000.</div>`;
      } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        resultDiv.style.display = 'block';
      }
    });
  }
});

/* ══════════════════════════════════════════════════════
   PAGE NAVIGATION
══════════════════════════════════════════════════════ */
window.switchPage = function (pageId, sidebarBtn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  const sbMap = { dashboard: 0, segmentasi: 1, rekomendasi: 2 };
  const sbItems = document.querySelectorAll('.sb-nav .sb-item');
  if (sbMap[pageId] !== undefined) {
    sbItems.forEach(b => b.classList.remove('active'));
    if (sbItems[sbMap[pageId]]) sbItems[sbMap[pageId]].classList.add('active');
  }

  if (pageId === 'dashboard' && !pieChart) initPieChart();
};

window.switchNavTab = function (btn) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

function syncNavTabsWithPages() {
  document.querySelectorAll('.sb-nav .sb-item').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const tabs = document.querySelectorAll('.nav-tab');
      tabs.forEach(t => t.classList.remove('active'));
      if (tabs[i]) tabs[i].classList.add('active');
    });
  });
}

/* ══════════════════════════════════════════════════════
   BAR CHART
══════════════════════════════════════════════════════ */
function initBarChart(type) {
  const ctx = document.getElementById('barMain');
  if (!ctx) return;

  const d = BAR_DATA[type];
  const fillAlpha = 'CC';
  const hoverAlpha = 'FF';
  const softFills = d.colors.map(c => c + fillAlpha);
  const hoverFills = d.colors.map(c => c + hoverAlpha);

  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Cluster 0\nBeban Rendah', 'Cluster 1\nBeban Menengah', 'Cluster 2\nBeban Tinggi'],
      datasets: [{
        label: d.label,
        data: d.data,
        backgroundColor: softFills,
        hoverBackgroundColor: hoverFills,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: { topLeft: 8, topRight: 8 },
        borderSkipped: 'bottom',
        barPercentage: 0.85,
        categoryPercentage: 0.9,
        maxBarThickness: 130
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutCubic' },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#9CA3AF',
            font: { family: 'DM Sans', size: 11, weight: '500' },
            padding: 6
          }
        },
        y: {
          grid: {
            color: 'rgba(99,102,241,0.06)',
            lineWidth: 1,
            drawBorder: false
          },
          border: { display: false, dash: [4, 4] },
          ticks: {
            color: '#9CA3AF',
            font: { family: 'DM Mono', size: 10 },
            maxTicksLimit: 5,
            padding: 8
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E1B4B',
          titleColor: '#FFFFFF',
          bodyColor: '#E5E7EB',
          titleFont: { family: 'DM Sans', size: 12, weight: '600' },
          bodyFont: { family: 'DM Mono', size: 11 },
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: items => items[0].label.replace('\n', ' — '),
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

/* ══════════════════════════════════════════════════════
   RADAR CHART
══════════════════════════════════════════════════════ */
function initRadarChart() {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;

  const labels = ['Usage kWh', 'Lagging PF', 'Leading PF', 'CO₂', 'NSM', 'Load Type'];
  const keys = ['Usage_kWh', 'Lagging_PF', 'Leading_PF', 'CO2_tCO2', 'NSM', 'Load_Type'];

  const palette = [
    { border: '#059669', bg: 'rgba(5, 150, 105, 0.07)' },
    { border: '#2563EB', bg: 'rgba(37, 99, 235, 0.07)' },
    { border: '#DC2626', bg: 'rgba(220, 38, 38, 0.07)' }
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
        borderWidth: 1,
        pointRadius: 2.5,
        pointHoverRadius: 4,
        pointBackgroundColor: palette[i].border,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      scales: {
        r: {
          grid: { color: 'rgba(99,102,241,0.08)', lineWidth: 0.8 },
          angleLines: { color: 'rgba(99,102,241,0.08)', lineWidth: 0.8 },
          ticks: {
            color: '#9CA3AF',
            backdropColor: 'transparent',
            font: { family: 'DM Mono', size: 8 },
            stepSize: 0.5
          },
          pointLabels: {
            color: '#6B7280',
            font: { family: 'DM Sans', size: 11, weight: '500' }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E1B4B',
          titleColor: '#FFFFFF',
          bodyColor: '#E5E7EB',
          titleFont: { family: 'DM Sans', size: 12 },
          bodyFont: { family: 'DM Mono', size: 11 },
          padding: 10,
          cornerRadius: 8
        }
      }
    }
  });
}

/* ══════════════════════════════════════════════════════
   PIE CHART
══════════════════════════════════════════════════════ */
function initPieChart() {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cluster 0 — Low Load', 'Cluster 1 — Medium', 'Cluster 2 — High Load'],
      datasets: [{
        data: [42, 33, 25],
        backgroundColor: ['#38BDF8', '#818CF8', '#A78BFA'],
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
          backgroundColor: '#1E1B4B',
          titleColor: '#FFFFFF',
          bodyColor: '#E5E7EB',
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

/* ══════════════════════════════════════════════════════
   DETAIL CLUSTER VIEW
══════════════════════════════════════════════════════ */
window.switchDetail = function (idx, btn) {
  const radarPanel = document.getElementById('detailRadar');
  const statsPanel = document.getElementById('detailContent');
  if (radarPanel && radarPanel.style.display !== 'none') {
    radarPanel.style.display = 'none';
    statsPanel.style.display = '';
  }
  document.querySelectorAll('#page-segmentasi .detail-tabs .dtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  initDetailContent(idx);
};

window.switchDetailView = function (view, btn) {
  const radarPanel = document.getElementById('detailRadar');
  const statsPanel = document.getElementById('detailContent');
  const clusterBtns = document.querySelectorAll('#page-segmentasi .detail-tabs .dtab:not(.dtab-radar)');

  if (view === 'radar') {
    statsPanel.style.display = 'none';
    radarPanel.style.display = 'flex';
    clusterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (!radarChart) initRadarChart();
    else radarChart.resize();
  }
};

function initDetailContent(idx) {
  const el = document.getElementById('detailContent');
  if (!el) return;

  const kpi = DATA.kpis[idx];
  const col = DATA.clusterColors[idx];
  const recForCluster = CBF_RULES.filter(r => r.cluster === idx);

  // Delta vs ideal (Cluster 0 as baseline)
  const ideal = DATA.kpis[0];
  const deltaKwh = idx === 0 ? null : ((kpi.usage - ideal.usage) / ideal.usage * 100).toFixed(0);
  const deltaCo2 = idx === 0 ? null : ((kpi.co2 - ideal.co2) / ideal.co2 * 100).toFixed(0);
  const deltaPf = idx === 0 ? null : (kpi.pf - ideal.pf).toFixed(1);

  const deltaTag = (val, unit, inverse = false) => {
    if (val === null) return `<span style="font-size:10px;color:var(--green-text);font-weight:600">✓ Baseline ideal</span>`;
    const bad = inverse ? parseFloat(val) > 0 : parseFloat(val) < 0;
    const color = bad ? 'var(--red-text)' : 'var(--green-text)';
    const sign = parseFloat(val) > 0 ? '+' : '';
    return `<span style="font-size:10px;color:${color};font-weight:600">${sign}${val}${unit} vs ideal</span>`;
  };

  const recHTML = recForCluster.map(r => `
    <div style="padding:11px 0;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:5px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${r.rule}</span>
        <span class="kpi-badge-sm ${PRIO_CLASS[r.priority]}" style="flex-shrink:0">${PRIO_LABEL[r.priority]}</span>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${r.desc}</div>
      <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-muted);margin-top:2px">
        <i class="ti ti-trending-down" style="font-size:12px;color:${col.accent}"></i>
        <span style="font-family:'DM Mono',monospace;font-weight:600;color:${col.accent}">${r.gap}</span>
      </div>
    </div>
  `).join('');

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;padding-top:4px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div style="padding:12px 14px;background:${col.bg};border-radius:var(--radius-sm);text-align:center;border:1px solid ${col.accent}22">
          <div style="font-size:10px;font-weight:700;color:${col.text};margin-bottom:6px;letter-spacing:0.06em;text-transform:uppercase">Usage Avg</div>
          <div style="font-size:22px;font-weight:700;color:${col.accent};font-family:'DM Mono',monospace;letter-spacing:-0.5px;line-height:1">${kpi.usage}<span style="font-size:12px;font-weight:400;color:${col.text}"> kWh</span></div>
          <div style="margin-top:6px">${deltaTag(deltaKwh, '%')}</div>
        </div>
        <div style="padding:12px 14px;background:${col.bg};border-radius:var(--radius-sm);text-align:center;border:1px solid ${col.accent}22">
          <div style="font-size:10px;font-weight:700;color:${col.text};margin-bottom:6px;letter-spacing:0.06em;text-transform:uppercase">CO₂ Avg</div>
          <div style="font-size:22px;font-weight:700;color:${col.accent};font-family:'DM Mono',monospace;letter-spacing:-0.5px;line-height:1">${kpi.co2}<span style="font-size:12px;font-weight:400;color:${col.text}"> tCO₂</span></div>
          <div style="margin-top:6px">${deltaTag(deltaCo2, '%')}</div>
        </div>
        <div style="padding:12px 14px;background:${col.bg};border-radius:var(--radius-sm);text-align:center;border:1px solid ${col.accent}22">
          <div style="font-size:10px;font-weight:700;color:${col.text};margin-bottom:6px;letter-spacing:0.06em;text-transform:uppercase">Lagging PF</div>
          <div style="font-size:22px;font-weight:700;color:${col.accent};font-family:'DM Mono',monospace;letter-spacing:-0.5px;line-height:1">${kpi.pf}<span style="font-size:12px;font-weight:400;color:${col.text}">%</span></div>
          <div style="margin-top:6px">${deltaTag(deltaPf, ' pp', true)}</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.65;padding:12px 14px;background:var(--surface2);border-radius:var(--radius-sm);border-left:3px solid ${col.accent}">
        ${DATA.insights[idx]}
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:2px">
          Rekomendasi Tindakan (${recForCluster.length})
        </div>
        ${recHTML}
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════
   TIME HEATMAP
══════════════════════════════════════════════════════ */
function renderTimeHeatmap() {
  const el = document.getElementById('thmBars');
  if (!el) return;

  // Simulated hourly load profile (24h) — blend of all 3 clusters
  // Values 0–1 represent relative load intensity
  const hourlyLoad = [
    0.18, 0.14, 0.12, 0.11, 0.13, 0.22,  // 00–05
    0.38, 0.55, 0.72, 0.82, 0.88, 0.91,  // 06–11
    0.87, 0.93, 0.98, 0.97, 0.89, 0.76,  // 12–17
    0.62, 0.54, 0.47, 0.40, 0.33, 0.25   // 18–23
  ];

  // Color interpolation: green (low) → amber (mid) → red (peak)
  const getColor = (v) => {
    if (v < 0.4) return `rgba(5,150,105,${0.4 + v * 0.8})`;
    if (v < 0.7) return `rgba(217,119,6,${0.5 + v * 0.5})`;
    return `rgba(220,38,38,${0.55 + v * 0.45})`;
  };

  el.innerHTML = hourlyLoad.map((v, i) => `
    <div class="thm-bar" title="${String(i).padStart(2, '0')}:00 — ${Math.round(v * 100)}% load"
      style="height:${Math.max(6, v * 48)}px;background:${getColor(v)}">
    </div>
  `).join('');
}


window.switchRecCluster = function (filterIdx, btn) {
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

  if (rules.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:var(--text-muted);background:var(--surface2);border-radius:16px;border:1px dashed var(--border-mid);margin-top:20px">
      <div style="font-size:36px;margin-bottom:12px">🎉</div>
      <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px">Semua Aman!</div>
      <div style="font-size:13px;opacity:0.8">Tidak ada rekomendasi untuk filter ini. Indikator berada di zona optimal.</div>
    </div>`;
    return;
  }

  grid.innerHTML = rules.map(r => {
    const col = DATA.clusterColors[r.cluster];
    return `
    <div class="rec-card border-prio-${r.priority}">
      <div class="rc-top">
        <span class="rc-cluster" style="background:${col.bg};color:${col.text}">
          Cluster ${r.cluster}
        </span>
        <span class="rc-prio ${PRIO_CLASS[r.priority]}">${PRIO_LABEL[r.priority]}</span>
      </div>
      <div class="rc-rule">${r.rule}</div>
      <div class="rc-desc">${r.desc}</div>
      <div class="rc-gap">
        <i class="ti ti-trending-down" aria-hidden="true"></i>
        <span class="rc-gap-val">${r.gap}</span>
      </div>
    </div>
  `;
  }).join('');
}

/* ══════════════════════════════════════════════════════
   AREA CHART (24H LOAD PROFILE)
══════════════════════════════════════════════════════ */
function initAreaChart() {
  const ctx = document.getElementById('areaChart');
  if (!ctx) return;

  const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  // Realistic load data matching the new time heatmap profile
  const data = [18, 14, 12, 11, 13, 22, 38, 55, 72, 82, 88, 91, 87, 93, 98, 97, 89, 76, 62, 54, 47, 40, 33, 25];

  areaChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Rata-rata Penggunaan (kWh)',
        data: data,
        borderColor: '#6366F1', // var(--brand)
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.4, // Smooth curve
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366F1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E1B4B',
          titleColor: '#FFFFFF',
          bodyColor: '#E5E7EB',
          titleFont: { family: 'DM Sans', size: 12 },
          bodyFont: { family: 'DM Mono', size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ' ' + context.parsed.y + ' kWh';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6B7280',
            font: { family: 'DM Mono', size: 10 },
            maxTicksLimit: 12
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(99, 102, 241, 0.08)',
            drawBorder: false,
          },
          ticks: {
            color: '#9CA3AF',
            font: { family: 'DM Mono', size: 10 },
            stepSize: 20
          }
        }
      }
    }
  });
}

/* ══════════════════════════════════════════════════════
   RADAR CHART (DASHBOARD)
══════════════════════════════════════════════════════ */
function initRadarDashChart() {
  const ctx = document.getElementById('radarDashChart');
  if (!ctx) return;

  const labels = ['Usage kWh', 'Lagging PF', 'Leading PF', 'CO₂', 'NSM', 'Load Type'];
  const keys = ['Usage_kWh', 'Lagging_PF', 'Leading_PF', 'CO2_tCO2', 'NSM', 'Load_Type'];

  const palette = [
    { border: '#059669', bg: 'rgba(5, 150, 105, 0.15)' },
    { border: '#2563EB', bg: 'rgba(37, 99, 235, 0.15)' },
    { border: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)' }
  ];

  radarDashChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [0, 1, 2].map(i => ({
        label: `Cluster ${i}`,
        data: keys.map(k => DATA.profiles[i][k]),
        borderColor: palette[i].border,
        backgroundColor: palette[i].bg,
        borderWidth: 2,
        pointRadius: 2.5,
        pointHoverRadius: 4,
        pointBackgroundColor: palette[i].border,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(99,102,241,0.1)' },
          grid: { color: 'rgba(99,102,241,0.1)' },
          pointLabels: {
            color: '#6B7280',
            font: { family: 'DM Mono', size: 10 }
          },
          ticks: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E1B4B',
          titleColor: '#FFFFFF',
          bodyColor: '#E5E7EB',
          titleFont: { family: 'DM Sans', size: 12, weight: '600' },
          bodyFont: { family: 'DM Mono', size: 11 },
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: items => items[0].label.replace('\n', ' — '),
            label: ctx => ` ${ctx.raw}`
          }
        }
      }
    }
  });
}