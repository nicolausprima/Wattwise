const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  layers: '<path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 17 8 4 8-4"/>',
  spark: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m17.5 6.5 2-2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  arrow: '<path d="M5 12h13M13 7l5 5-5 5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  trend: '<path d="m4 16 5-5 4 3 6-7"/><path d="M15 7h4v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  moon: '<path d="M20.5 15.4A8.5 8.5 0 0 1 8.6 3.5 8.5 8.5 0 1 0 20.5 15.4Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
};

document.querySelectorAll('[data-icon]').forEach((el) => {
  const name = el.dataset.icon;
  if (icons[name]) el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
});

const tabs = {
  landing: 'Beranda',
  dashboard: 'Dashboard',
  segmentasi: 'Segmentasi',
  rekomendasi: 'Rekomendasi'
};

function showTab(name) {
  const next = tabs[name] ? name : 'landing';
  document.body.classList.toggle('landing-mode', next === 'landing');
  document.getElementById('landing-page')?.classList.toggle('active', next === 'landing');
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${next}`));
  document.querySelectorAll('.nav-item[data-tab]').forEach((item) => item.classList.toggle('active', item.dataset.tab === next));
  const crumb = document.getElementById('breadcrumb-current');
  if (crumb) crumb.textContent = tabs[next];
  document.querySelector('.sidebar')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.location.hash !== `#${next}`) history.replaceState(null, '', `#${next}`);
}


document.querySelectorAll('.nav-item[data-tab]').forEach((item) => item.addEventListener('click', () => showTab(item.dataset.tab)));
document.querySelectorAll('[data-view]').forEach((item) => item.addEventListener('click', () => showTab(item.dataset.view)));

const landingSections = ['hero', 'stats', 'workflow', 'cara-kerja', 'segmentasi-preview', 'rekomendasi-preview'];
const landingNavBtns = document.querySelectorAll('.landing-nav-btn[data-scroll-to]');

function updateActiveLandingNav() {
  if (!document.getElementById('landing-page')?.classList.contains('active')) return;
  const scrollPos = window.scrollY + 120;
  let currentId = 'hero';
  for (const id of landingSections) {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollPos) {
      currentId = id;
    }
  }
  landingNavBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.scrollTo === currentId);
  });
}

window.addEventListener('scroll', updateActiveLandingNav, { passive: true });

const revealTargets = document.querySelectorAll(
  '.landing-page .workflow-heading, .landing-page .section-head, .landing-page .workflow-grid article, .landing-page .landing-steps article, .landing-page .segment-card, .landing-page .landing-action, .landing-page .landing-cta'
);
if (revealTargets.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealTargets.forEach((target) => {
    target.classList.add('reveal');
    revealObserver.observe(target);
  });
}

document.querySelectorAll('[data-scroll-to]').forEach((item) => {
  item.addEventListener('click', () => {
    const targetId = item.dataset.scrollTo;
    const landing = document.getElementById('landing-page');
    if (!landing?.classList.contains('active')) {
      showTab('landing');
    }
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      landingNavBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.scrollTo === targetId));
    }
  });
});

document.querySelector('.brand-lockup')?.addEventListener('click', () => showTab('landing'));
window.addEventListener('hashchange', () => showTab(window.location.hash.slice(1)));
showTab(window.location.hash.slice(1) || 'landing');
document.querySelectorAll('[data-tab-target]').forEach((item) => item.addEventListener('click', () => showTab(item.dataset.tabTarget)));
document.getElementById('mobile-menu')?.addEventListener('click', () => document.querySelector('.sidebar')?.classList.toggle('open'));

document.getElementById('period-select')?.addEventListener('change', (event) => {
  const value = event.target.value;
  const label = value === '7' ? '7 hari' : value === '30' ? '30 hari' : '90 hari';
  showToast(`Periode diperbarui ke ${label} terakhir`);
});

document.querySelectorAll('.filter-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.filter-tab').forEach((item) => item.classList.remove('active'));
  tab.classList.add('active');
  const priority = tab.dataset.priority;
  document.querySelectorAll('.recommendation-row').forEach((row) => {
    row.style.display = priority === 'all' || row.dataset.priority === priority ? 'flex' : 'none';
  });
}));

document.querySelectorAll('.recommendation-row .button').forEach((button) => button.addEventListener('click', () => showToast('Aksi ditandai untuk ditinjau')));

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  const text = document.getElementById('toast-text');
  if (!toast || !text) return;
  text.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// Modal & Live ML Predict
const predictOverlay = document.getElementById('predictModalOverlay');
const btnOpenPredict = document.getElementById('btn-open-predict');
const btnClosePredict = document.getElementById('btn-close-predict');
const predictForm = document.getElementById('predictForm');
const predictResult = document.getElementById('predictResult');

function openPredictModal() {
  predictOverlay?.classList.add('open');
}

function closePredictModal() {
  predictOverlay?.classList.remove('open');
}

btnOpenPredict?.addEventListener('click', openPredictModal);
btnClosePredict?.addEventListener('click', closePredictModal);
predictOverlay?.addEventListener('click', (e) => {
  if (e.target === predictOverlay) closePredictModal();
});

const presetData = {
  '0': {
    Usage_kWh: 3.17,
    'Lagging_Current_Reactive.Power_kVarh': 0.05,
    Leading_Current_Reactive_Power_kVarh: 0.0,
    'CO2(tCO2)': 0.0,
    Lagging_Current_Power_Factor: 99.8,
    Leading_Current_Power_Factor: 100.0,
    NSM: 900,
    hour: 0,
    month: 1,
    is_weekend: 0
  },
  '1': {
    Usage_kWh: 3.71,
    'Lagging_Current_Reactive.Power_kVarh': 0.04,
    Leading_Current_Reactive_Power_kVarh: 18.28,
    'CO2(tCO2)': 0.0,
    Lagging_Current_Power_Factor: 99.8,
    Leading_Current_Power_Factor: 22.04,
    NSM: 59400,
    hour: 16,
    month: 3,
    is_weekend: 1
  },
  '2': {
    Usage_kWh: 5.98,
    'Lagging_Current_Reactive.Power_kVarh': 0.41,
    Leading_Current_Reactive_Power_kVarh: 9.68,
    'CO2(tCO2)': 0.0014,
    Lagging_Current_Power_Factor: 99.21,
    Leading_Current_Power_Factor: 52.28,
    NSM: 48600,
    hour: 13,
    month: 6,
    is_weekend: 0
  }
};

document.querySelectorAll('.preset-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.preset-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    const p = presetData[chip.dataset.preset];
    if (!p || !predictForm) return;
    Object.keys(p).forEach((k) => {
      const el = predictForm.elements[k];
      if (el) el.value = p[k];
    });
  });
});

predictForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-submit-predict');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Menganalisis...</span>';
  }

  const formData = new FormData(predictForm);
  const payload = {};
  formData.forEach((val, key) => {
    payload[key] = parseFloat(val);
  });

  try {
    const res = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      if (predictResult) predictResult.style.display = 'block';
      const badge = document.getElementById('resultClusterBadge');
      if (badge) badge.textContent = `Klaster ${data.cluster_id} · ${data.cluster_name}`;
      
      const meta = document.getElementById('resultMeta');
      if (meta && data.similarity_scores) {
        const sims = Object.entries(data.similarity_scores).map(([cid, s]) => `K${cid}: ${s}`).join(' · ');
        meta.textContent = `Cosine Similarity ke Centroid → ${sims}`;
      }

      const list = document.getElementById('resultRulesList');
      if (list) {
        list.innerHTML = (data.rules_applied || []).map((r) => {
          const pClass = r.priority === 1 ? 'p1' : r.priority === 2 ? 'p2' : 'p3';
          return `
            <div class="result-rule-item">
              <span class="result-rule-priority ${pClass}">P${r.priority}</span>
              <div class="result-rule-text">
                <div>${r.message}</div>
                <div class="result-rule-feature">Fitur: ${r.feature} ${r.gap ? `· Gap: ${r.gap}` : ''}</div>
              </div>
            </div>
          `;
        }).join('');
      }
      showToast(`Model memetakan: ${data.cluster_name}`);
    } else {
      showToast(`Gagal: ${data.message}`);
    }
  } catch (err) {
    showToast('Terjadi kesalahan memanggil API');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span data-icon="spark"></span> Jalankan Prediksi ML';
      document.querySelectorAll('#btn-submit-predict [data-icon]').forEach((el) => {
        const name = el.dataset.icon;
        if (icons[name]) el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
      });
    }
  }
});
