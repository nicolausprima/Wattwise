/* ══════════════════════════════════════════════════════
   DATA - single source of truth
══════════════════════════════════════════════════════ */
const DATA = {
  clusterCounts: [3600, 2800, 2200],

  profiles: {
    0: { Usage_kWh: -0.62, Lagging_PF: 0.91, Leading_PF: -0.23, 'CO2_tCO2': -0.58, NSM: 0.44, Load_Type: -0.71 },
    1: { Usage_kWh: -0.11, Lagging_PF: 0.42, Leading_PF: 0.68, 'CO2_tCO2': -0.09, NSM: 0.31, Load_Type: 0.22 },
    2: { Usage_kWh: 2.14, Lagging_PF: -0.87, Leading_PF: 0.11, 'CO2_tCO2': 2.05, NSM: -0.18, Load_Type: 1.33 }
  },

  names: {
    0: 'Beban Rendah',
    1: 'Beban Menengah',
    2: 'Beban Tinggi'
  },

  kpis: {
    0: { usage: 4.2, co2: 0.0015, pf: 86.2 },
    1: { usage: 9.8, co2: 0.0041, pf: 72.4 },
    2: { usage: 31.4, co2: 0.0138, pf: 58.1 }
  },

  insights: {
    0: 'Pola paling hemat: idle akhir pekan, PF 86,2%. Dipakai sebagai acuan. PR: matikan standby + kejar PF 90%.',
    1: 'Shift malam hari kerja, PF 72,4%. Waspada daya reaktif naik saat ganti shift. PR: geser beban ke 22.00–05.00.',
    2: 'Shift siang, 31,4 kWh (7,5× acuan), PF 58,1%. Biang boros + denda PLN. PR: audit, capacitor bank, pangkas puncak.'
  },

  clusterColors: {
    0: { bg: '#ECFDF5', text: '#065F46', accent: '#059669', label: 'Cluster 0' },
    1: { bg: '#EFF6FF', text: '#1E40AF', accent: '#2563EB', label: 'Cluster 1' },
    2: { bg: '#FEF2F2', text: '#991B1B', accent: '#DC2626', label: 'Cluster 2' }
  }
};

const PRIO_LABEL = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang' };
const PRIO_CLASS = { critical: 'prio-critical', high: 'prio-high', medium: 'prio-medium' };

const CBF_RULES = [
  {
    cluster: 0,
    priority: 'medium',
    rule: 'Kejar PF 90%',
    desc: 'Sudah 86,2%, kurang 3,8 poin. Capacitor bank kecil cukup.',
    gap: 'Kurang 3,8 poin ke target'
  },
  {
    cluster: 0,
    priority: 'medium',
    rule: 'Cabut Beban Standby',
    desc: 'Mesin idle tetap nyedot reaktif. Matikan yang tidak produksi.',
    gap: 'Hemat 12% kVarh'
  },
  {
    cluster: 0,
    priority: 'medium',
    rule: 'Servis di Jam Sepi',
    desc: 'Waktu sepi (NSM tinggi) paling aman buat maintenance.',
    gap: 'Produksi tidak berhenti'
  },
  {
    cluster: 1,
    priority: 'high',
    rule: 'Pindah ke Tarif Malam',
    desc: 'Beban besar pindah ke 22.00–05.00, tarif murah + potong peak.',
    gap: 'Hemat 15–25% biaya'
  },
  {
    cluster: 1,
    priority: 'high',
    rule: 'Pasang Monitor Reaktif',
    desc: 'Reaktif 28,1 kVarh, PF 72,4%. Naik beban dikit bisa jebol. Pantau real-time.',
    gap: 'PF 72,4% (target 85%)'
  },
  {
    cluster: 1,
    priority: 'medium',
    rule: 'Timer Kompresor & Pompa',
    desc: 'Jangan nyala terus saat shift malam. Smart timer matikan otomatis.',
    gap: 'Hemat 10% kWh'
  },
  {
    cluster: 2,
    priority: 'critical',
    rule: 'Audit Pemborosan',
    desc: '31,4 kWh = 7,5× acuan. Cari mesin paling rakus dulu, baru hemat.',
    gap: 'Selisih 27,2 kWh vs acuan'
  },
  {
    cluster: 2,
    priority: 'critical',
    rule: 'Pasang Capacitor Bank',
    desc: 'PF 58,1%, jauh dari 85%. Kena denda + boros. Ini prioritas 1.',
    gap: 'PF 58,1% (target 85%)'
  },
  {
    cluster: 2,
    priority: 'critical',
    rule: 'Pangkas Beban Puncak',
    desc: 'Siang hari (NSM rendah) bikin demand charge jebol. Pakai peak shaving.',
    gap: 'CO₂ 0,0138 t rata-rata'
  },
  {
    cluster: 2,
    priority: 'high',
    rule: 'Ganti Mesin Tua',
    desc: 'Mesin >10 tahun biang boros. Ganti ke motor IE3/IE4.',
    gap: 'Hemat 20–30% kWh'
  }
];

const BAR_DATA = {
  kwh: {
    label: 'Rata-rata kWh',
    data: [4.2, 9.8, 31.4],
    colors: ['#059669', '#2563EB', '#DC2626']
  },
  co2: {
    label: 'Rata-rata CO₂ (kg)',
    data: [1.5, 4.1, 13.8],
    colors: ['#059669', '#2563EB', '#DC2626']
  },
  pf: {
    label: 'Power Factor (%)',
    data: [86.2, 72.4, 58.1],
    colors: ['#059669', '#2563EB', '#DC2626']
  }
};

let radarChart = null;
let barChart = null;
let areaChart = null;
let radarDashChart = null;

/* ══════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════ */
let chartsReady = false;
let pendingDeepPage = null;

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

    // Init charts after shell is visible (sekali saja)
    setTimeout(() => {
      if (!chartsReady) {
        initBarChart('kwh');
        initAreaChart();
        initRadarDashChart();
        initDetailContent(0);
        renderRecGrid(null);
        renderTimeHeatmap();
        chartsReady = true;
      }
      // Hormati deep-link hash yang diminta sebelum masuk
      const want = (pendingDeepPage && VALID_PAGES.includes(pendingDeepPage)) ? pendingDeepPage : null;
      pendingDeepPage = null;
      if (want && want !== 'dashboard') switchPage(want, null);
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

/* entry ke dashboard hanya via tombol/CTA (enterDashboard) */
/* deep-link: ingat hash awal agar dipulihkan setelah overlay ditutup */
(function rememberDeepLink() {
  const h = (window.location.hash || '').replace('#/', '').replace('#', '');
  if (['segmentasi', 'rekomendasi'].includes(h)) pendingDeepPage = h;
})();

/* ══════════════════════════════════════════════════════
   MODAL (focus trap + return focus + Esc)
══════════════════════════════════════════════════════ */
const modalFocusStack = [];

function trapTabInModal(e, box) {
  if (e.key !== 'Tab') return;
  const items = box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const focusable = Array.from(items).filter(el => !el.disabled && el.offsetParent !== null);
  if (focusable.length === 0) { e.preventDefault(); return; }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function bindModalKeys(overlayId, closeFn) {
  const overlay = document.getElementById(overlayId);
  if (!overlay || overlay.dataset.keysBound) return;
  overlay.dataset.keysBound = '1';
  overlay.addEventListener('keydown', (e) => {
    const box = overlay.querySelector('.modal-box');
    if (e.key === 'Tab' && box) trapTabInModal(e, box);
    if (e.key === 'Escape') { e.stopPropagation(); closeFn(); }
  });
}

function openModalWithFocus(overlayId, closeFn) {
  modalFocusStack.push(document.activeElement);
  const overlay = document.getElementById(overlayId);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  bindModalKeys(overlayId, closeFn);
  const box = overlay.querySelector('.modal-box');
  const first = box ? box.querySelector('button, input, select, [tabindex]') : null;
  if (first) setTimeout(() => first.focus(), 60);
}

function closeModalWithFocus(overlayId) {
  const overlay = document.getElementById(overlayId);
  setTimeout(() => {
    overlay.classList.remove('open');
    overlay.style.animation = '';
    document.body.style.overflow = '';
    const prev = modalFocusStack.pop();
    if (prev && document.contains(prev)) {
      prev.focus();
    }
  }, 160);
}

window.openModal = function () {
  openModalWithFocus('modalOverlay', closeModal);
};

window.closeModal = function () {
  closeModalWithFocus('modalOverlay');
};

window.closeModalOutside = function (e) {
  if (e.target === document.getElementById('modalOverlay')) {
    closeModal();
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const p = document.getElementById('predictModalOverlay');
    const m = document.getElementById('modalOverlay');
    if (p && p.classList.contains('open')) closePredictModal();
    else if (m && m.classList.contains('open')) closeModal();
  }
});

/* ══════════════════════════════════════════════════════
   PREDICT MODAL & FETCH LOGIC
══════════════════════════════════════════════════════ */
window.openPredictModal = function () {
  openModalWithFocus('predictModalOverlay', closePredictModal);
};

window.closePredictModal = function () {
  closeModalWithFocus('predictModalOverlay');
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

      // hapus error inline lama
      form.querySelectorAll('.field-error').forEach(el => el.remove());
      form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));

      const showFieldError = (name, msg, hintId) => {
        const input = form.querySelector(`[name="${CSS.escape(name)}"]`);
        if (!input) return;
        input.setAttribute('aria-invalid', 'true');
        if (hintId) input.setAttribute('aria-describedby', hintId);
        const err = document.createElement('div');
        err.className = 'field-error';
        err.textContent = msg;
        input.insertAdjacentElement('afterend', err);
      };

      const raw = {};
      new FormData(form).forEach((value, key) => { raw[key] = value; });

      // Validasi per-field: semua input angka wajib terisi angka valid.
      // Nilai name harus sama persis dengan kolom scaler (lihat api/index.py).
      const HINT = {
        'Usage_kWh': 'hint-usage',
        'Lagging_Current_Reactive.Power_kVarh': 'hint-lag',
        'Leading_Current_Reactive_Power_kVarh': 'hint-lead',
        'CO2(tCO2)': 'hint-co2',
        'Lagging_Current_Power_Factor': 'hint-lagpf',
        'Leading_Current_Power_Factor': 'hint-leadpf',
        'NSM': 'hint-nsm',
        'hour': 'hint-hour',
        'month': 'hint-month',
        'is_weekend': 'hint-weekend'
      };
      const specs = [
        { name: 'Usage_kWh', label: 'Konsumsi Energi (kWh)', min: 0 },
        { name: 'Lagging_Current_Reactive.Power_kVarh', label: 'Daya Reaktif Induktif (kVarh)', min: 0 },
        { name: 'Leading_Current_Reactive_Power_kVarh', label: 'Daya Reaktif Kapasitif (kVarh)', min: 0 },
        { name: 'CO2(tCO2)', label: 'Emisi Karbon (tCO2)', min: 0 },
        { name: 'Lagging_Current_Power_Factor', label: 'Power Factor Induktif (%)', min: 0, max: 100 },
        { name: 'Leading_Current_Power_Factor', label: 'Power Factor Kapasitif (%)', min: 0, max: 100 },
        { name: 'NSM', label: 'NSM (detik)', min: 0, max: 86399 },
        { name: 'hour', label: 'Jam (0-23)', min: 0, max: 23, integer: true },
        { name: 'month', label: 'Bulan (1-12)', min: 1, max: 12, integer: true },
        { name: 'is_weekend', label: 'Tipe Hari', allowed: ['0', '1'] }
      ];

      const data = {};
      let hasError = false;
      let firstBad = null;
      specs.forEach(s => {
        const v = (raw[s.name] ?? '').toString().trim();
        if (v === '') { showFieldError(s.name, `${s.label} wajib diisi.`, HINT[s.name]); hasError = true; firstBad = firstBad || s.name; return; }
        if (s.allowed) {
          if (!s.allowed.includes(v)) { showFieldError(s.name, `${s.label} tidak valid.`, HINT[s.name]); hasError = true; firstBad = firstBad || s.name; return; }
          data[s.name] = parseInt(v, 10);
          return;
        }
        const num = Number(v);
        if (!Number.isFinite(num)) { showFieldError(s.name, `${s.label} harus angka.`, HINT[s.name]); hasError = true; firstBad = firstBad || s.name; return; }
        if (s.integer && !Number.isInteger(num)) { showFieldError(s.name, `${s.label} harus bilangan bulat.`, HINT[s.name]); hasError = true; firstBad = firstBad || s.name; return; }
        if (s.min !== undefined && num < s.min) { showFieldError(s.name, `${s.label} minimal ${s.min}.`, HINT[s.name]); hasError = true; firstBad = firstBad || s.name; return; }
        if (s.max !== undefined && num > s.max) { showFieldError(s.name, `${s.label} maksimal ${s.max}.`, HINT[s.name]); hasError = true; firstBad = firstBad || s.name; return; }
        data[s.name] = num;
      });

      if (hasError) {
        resultDiv.style.display = 'none';
        const bad = form.querySelector(`[name="${CSS.escape(firstBad)}"]`);
        if (bad) bad.focus();
        return; // input user dipertahankan - tidak ada reset
      }

      btn.innerHTML = '<span>Memproses ML...</span> <i class="ti ti-loader" style="animation: spin 1s linear infinite"></i>';
      btn.disabled = true;
      resultDiv.style.display = 'none';

      // Same-origin '/api/predict' (vercel.json route -> api/index.py).
      // Fallback: origin yg sama tanpa prefix /api (dev Flask langsung: POST /predict) serta port dev lokal.
      const endpoints = [
        '/api/predict',
        window.location.origin + '/predict',
        'http://127.0.0.1:5000/predict',
        'http://localhost:5000/predict'
      ];
      let res = null;
      let lastErr = null;
      for (const url of endpoints) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const text = await response.text();
          let parsed = null;
          try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = null; }
          if (!response.ok) {
            lastErr = (parsed && parsed.message) ? parsed.message : `HTTP ${response.status}`;
            continue; // coba endpoint berikutnya
          }
          if (!parsed || typeof parsed !== 'object') { lastErr = 'Respons server tidak valid (bukan JSON).'; continue; }
          res = parsed;
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      const showRetry = (msg, payload) => {
        resultDiv.innerHTML = `
          <div style="color: var(--red); font-weight: bold;">${msg}</div>
          <button type="button" id="predictRetryBtn" class="modal-btn-primary" style="margin-top:12px;">Coba lagi (kirim ulang)</button>
        `;
        resultDiv.style.display = 'block';
        const retry = document.getElementById('predictRetryBtn');
        if (retry) retry.addEventListener('click', () => {
          if (payload) {
            // Isi kembali payload terakhir lalu submit ulang
            Object.entries(payload).forEach(([k, val]) => {
              const input = form.querySelector(`[name="${CSS.escape(k)}"]`);
              if (input) input.value = val;
            });
            form.requestSubmit();
          } else {
            resultDiv.style.display = 'none';
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
            const first = form.querySelector('input, select');
            if (first) first.focus();
          }
        });
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
      };

      try {
        // Kontrak api/index.py: {status, cluster_id, cluster_name, rules_applied} sukses;
        // {status:"error", message} + HTTP 400 saat gagal.
        const ok = res && res.status === 'success'
          && Number.isInteger(res.cluster_id)
          && typeof res.cluster_name === 'string'
          && Array.isArray(res.rules_applied);

        if (ok) {
          let rulesHtml = '';
          if (res.rules_applied.length > 0) {
            rulesHtml = '<ul style="margin: 10px 0 0 20px; font-size: 13px; color: var(--text-secondary);">';
            res.rules_applied.forEach(r => {
              const feat = (r && r.feature !== undefined) ? r.feature : '-';
              const prio = (r && r.priority !== undefined) ? r.priority : '-';
              rulesHtml += `<li><span style="font-weight:600">${feat}</span> (Prioritas: ${prio})</li>`;
            });
            rulesHtml += '</ul>';
          } else {
            rulesHtml = '<p style="font-size: 13px; color: var(--text-muted);">Belum ada saran untuk pola ini.</p>';
          }

          resultDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 8px;">
              <div style="background:var(--green); color:white; padding: 4px 10px; border-radius: var(--radius-xs); font-weight: bold; font-size: 12px; display:inline-flex; align-items:center; gap:4px;"><i class="ti ti-check"></i> Ketemu</div>
              <div style="font-size: 16px; font-weight: bold; color: var(--text-primary);">Pola ${res.cluster_id}: ${res.cluster_name}</div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Cluster ${res.cluster_id} · ${res.cluster_name}</div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">Saran untuk pola ini:</div>
            ${rulesHtml}
            <button type="button" class="modal-btn-primary" style="margin-top:14px;" data-goto-rec-cluster="${res.cluster_id}">Lihat saran Cluster ${res.cluster_id}</button>
          `;
          btn.innerHTML = originalBtnText;
          btn.disabled = false;
          resultDiv.style.display = 'block';
        } else if (res && res.status === 'error') {
          showRetry(`Prediksi gagal: ${res.message || 'input tidak valid.'} Periksa isian lalu coba lagi.`, data);
        } else if (res) {
          showRetry('Respons server tidak lengkap. Coba lagi.', data);
        } else {
          const detail = (lastErr && lastErr.message) ? lastErr.message : lastErr;
          showRetry(`Tidak dapat menghubungi backend ML${detail ? ` (${detail})` : ''}. Pastikan server API berjalan, lalu coba lagi.`, data);
        }
      } catch (error) {
        showRetry('Terjadi kesalahan tak terduga. Coba lagi.', data);
      }
    });

    // ── KALKULASI OTOMATIS NSM DARI JAM & MENIT ──
    const hourInput = form.querySelector('[name="hour"]');
    const minuteInput = form.querySelector('#pf-minute');
    const nsmInput = form.querySelector('[name="NSM"]');
    const nsmDisplay = document.getElementById('nsmDisplay');

    const updateNSM = () => {
      let h = parseInt(hourInput ? hourInput.value : 0, 10);
      let m = parseInt(minuteInput ? minuteInput.value : 0, 10);
      if (isNaN(h)) h = 0;
      if (isNaN(m)) m = 0;
      h = Math.max(0, Math.min(23, h));
      m = Math.max(0, Math.min(59, m));
      const nsm = (h * 3600) + (m * 60);
      if (nsmInput) nsmInput.value = nsm;
      if (nsmDisplay) nsmDisplay.textContent = `${nsm.toLocaleString('id-ID')} detik`;
    };

    if (hourInput) hourInput.addEventListener('input', updateNSM);
    if (minuteInput) minuteInput.addEventListener('input', updateNSM);

    // ── 3 PRESET SKENARIO PABRIK ──
    const PRESETS = {
      peak: {
        'Usage_kWh': 31.4,
        'Lagging_Current_Reactive.Power_kVarh': 28.1,
        'Leading_Current_Reactive_Power_kVarh': 0.5,
        'CO2(tCO2)': 0.0138,
        'Lagging_Current_Power_Factor': 58.1,
        'Leading_Current_Power_Factor': 99.0,
        'hour': 14,
        'minute': 0,
        'month': 6,
        'is_weekend': '0'
      },
      night: {
        'Usage_kWh': 9.8,
        'Lagging_Current_Reactive.Power_kVarh': 15.2,
        'Leading_Current_Reactive_Power_kVarh': 12.0,
        'CO2(tCO2)': 0.0041,
        'Lagging_Current_Power_Factor': 72.4,
        'Leading_Current_Power_Factor': 98.5,
        'hour': 23,
        'minute': 0,
        'month': 6,
        'is_weekend': '0'
      },
      idle: {
        'Usage_kWh': 4.2,
        'Lagging_Current_Reactive.Power_kVarh': 2.1,
        'Leading_Current_Reactive_Power_kVarh': 0.0,
        'CO2(tCO2)': 0.0015,
        'Lagging_Current_Power_Factor': 86.2,
        'Leading_Current_Power_Factor': 100.0,
        'hour': 10,
        'minute': 0,
        'month': 6,
        'is_weekend': '1'
      }
    };

    const applyPreset = (key) => {
      const p = PRESETS[key];
      if (!p) return;
      Object.entries(p).forEach(([k, val]) => {
        if (k === 'minute') {
          if (minuteInput) minuteInput.value = val;
        } else {
          const input = form.querySelector(`[name="${CSS.escape(k)}"]`);
          if (input) input.value = val;
        }
      });
      updateNSM();
      form.querySelectorAll('.field-error').forEach(el => el.remove());
      form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-preset') === key);
      });
    };

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        applyPreset(key);
      });
    });

    // Inisialisasi awal nilai NSM
    updateNSM();

    // Tombol Contoh Beban Puncak
    const fillBtn = document.getElementById('predictFillBtn');
    if (fillBtn) fillBtn.addEventListener('click', () => {
      applyPreset('peak');
      if (hourInput) hourInput.focus();
    });

    // Tombol Reset
    const resetBtn = document.getElementById('predictResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      const resultDiv = document.getElementById('predictResult');
      if (resultDiv) resultDiv.style.display = 'none';
      form.querySelectorAll('.field-error').forEach(el => el.remove());
      form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
      document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
      setTimeout(updateNSM, 50);
    });
  }
});

/* ══════════════════════════════════════════════════════
   PAGE NAVIGATION + HASH ROUTING (#/dashboard dst)
══════════════════════════════════════════════════════ */
const VALID_PAGES = ['dashboard', 'segmentasi', 'rekomendasi'];

window.switchPage = function (pageId, sidebarBtn, skipHash) {
  if (!VALID_PAGES.includes(pageId)) pageId = 'dashboard';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  const sbMap = { dashboard: 0, segmentasi: 1, rekomendasi: 2 };
  const sbItems = document.querySelectorAll('.sb-nav .sb-item');
  if (sbMap[pageId] !== undefined) {
    sbItems.forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
    if (sbItems[sbMap[pageId]]) {
      sbItems[sbMap[pageId]].classList.add('active');
      sbItems[sbMap[pageId]].setAttribute('aria-current', 'page');
    }
  }

  // Kalau overlay landing masih tampil, jangan sentuh hash (biar deep-link utuh)
  const overlay = document.getElementById('landingOverlay');
  const gated = overlay && overlay.style.display !== 'none';
  if (gated && pendingDeepPage === null && pageId !== 'dashboard') pendingDeepPage = pageId;

  if (!skipHash && !gated && window.location.hash !== '#/' + pageId) {
    window.location.hash = '#/' + pageId;
  }
};

window.addEventListener('hashchange', () => {
  const pageId = window.location.hash.replace('#/', '').replace('#', '');
  const overlay = document.getElementById('landingOverlay');
  const gated = overlay && overlay.style.display !== 'none';
  if (VALID_PAGES.includes(pageId)) {
    if (gated) pendingDeepPage = pageId;
    else switchPage(pageId, null, true);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const pageId = window.location.hash.replace('#/', '').replace('#', '');
  if (VALID_PAGES.includes(pageId)) {
    const overlay = document.getElementById('landingOverlay');
    const gated = !overlay || overlay.style.display !== 'none';
    if (gated) pendingDeepPage = pageId;
    else switchPage(pageId, null, true);
  }
  else if (!window.location.hash) window.location.hash = '#/dashboard';

  // Delegasi global: tombol "lihat saran Cluster X" (anti indeks rapuh)
  document.addEventListener('click', (e) => {
    const gotoBtn = e.target.closest('[data-goto-rec-cluster]');
    if (!gotoBtn) return;
    const cid = parseInt(gotoBtn.dataset.gotoRecCluster, 10);
    if (!Number.isInteger(cid) || cid < 0 || cid > 2) return;
    // Tutup modal predict bila terbuka (kembali fokus via stack)
    const pOverlay = document.getElementById('predictModalOverlay');
    const closeIt = pOverlay && pOverlay.classList.contains('open');
    const go = () => {
      switchPage('rekomendasi', null);
      const tabs = document.querySelectorAll('#page-rekomendasi .dtab');
      const tab = tabs[cid + 1];
      if (tab) switchRecCluster(cid + 1, tab);
    };
    if (closeIt) { closePredictModal(); setTimeout(go, 200); }
    else go();
  });
});

/* ══════════════════════════════════════════════════════
   BAR CHART
══════════════════════════════════════════════════════ */
function initBarChart(type) {
  const ctx = document.getElementById('barMain');
  if (!ctx) return;

  if (typeof Chart === 'undefined') {
    const wrap = ctx.parentElement;
    if (wrap && !wrap.querySelector('.chart-fallback')) {
      const fb = document.createElement('div');
      fb.className = 'chart-fallback';
      fb.textContent = 'Chart tidak dapat dimuat (CDN Chart.js gagal). Data: C0 4.2 kWh, C1 9.8 kWh, C2 31.4 kWh.';
      wrap.appendChild(fb);
    }
    updateStatStrip(type);
    return;
  }

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
            color: '#475569',
            font: { family: 'DM Sans', size: 11, weight: '500' },
            padding: 6
          }
        },
        y: {
          grid: {
            color: 'rgba(15,118,110,0.06)',
            lineWidth: 1,
            drawBorder: false
          },
          border: { display: false, dash: [4, 4] },
          ticks: {
            color: '#475569',
            font: { family: 'DM Mono', size: 12 },
            maxTicksLimit: 5,
            padding: 8
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          titleColor: '#FFFFFF',
          bodyColor: '#E5E7EB',
          titleFont: { family: 'DM Sans', size: 12, weight: '600' },
          bodyFont: { family: 'DM Mono', size: 11 },
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: items => items[0].label.replace('\n', ' - '),
            label: ctx => ` ${ctx.raw} ${d.label}`
          }
        }
      }
    }
  });
}

window.switchBarChart = function (type, btn) {
  if (btn) {
    document.querySelectorAll('.tab-group .tg-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
  initBarChart(type);
  updateStatStrip(type);
};

/* Stat strip ikut metrik tab */
const STAT_STRIP = {
  kwh: { vals: ['4,2 kWh', '9,8 kWh', '31,4 kWh'], subs: ['0,0015 tCO₂', '0,0041 tCO₂', '0,0138 tCO₂'] },
  co2: { vals: ['1,5 kgCO₂', '4,1 kgCO₂', '13,8 kgCO₂'], subs: ['4,2 kWh', '9,8 kWh', '31,4 kWh'] },
  pf: { vals: ['86,2%', '72,4%', '58,1%'], subs: ['standar ≥85%: lolos', 'standar ≥85%: kurang 12,6 poin', 'standar ≥85%: kurang 26,9 poin'] }
};
function updateStatStrip(type) {
  const m = STAT_STRIP[type];
  if (!m) return;
  document.querySelectorAll('[data-css-val]').forEach(el => {
    const i = parseInt(el.dataset.cssVal, 10);
    if (m.vals[i]) el.textContent = m.vals[i];
  });
  document.querySelectorAll('[data-css-sub]').forEach(el => {
    const i = parseInt(el.dataset.cssSub, 10);
    if (m.subs[i]) el.textContent = m.subs[i];
  });
}

/* ══════════════════════════════════════════════════════
   RADAR CHART
══════════════════════════════════════════════════════ */
function initRadarChart() {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;

  const labels = ['kWh', 'PF Lagging', 'PF Leading', 'CO₂', 'NSM', 'Tipe Beban'];
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
          grid: { color: 'rgba(15,118,110,0.08)', lineWidth: 0.8 },
          angleLines: { color: 'rgba(15,118,110,0.08)', lineWidth: 0.8 },
          ticks: {
            color: '#475569',
            backdropColor: 'transparent',
            font: { family: 'DM Mono', size: 12 },
            stepSize: 0.5
          },
          pointLabels: {
            color: '#475569',
            font: { family: 'DM Sans', size: 11, weight: '500' }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
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
   DETAIL CLUSTER VIEW
══════════════════════════════════════════════════════ */
window.switchDetail = function (idx, btn) {
  const radarPanel = document.getElementById('detailRadar');
  const statsPanel = document.getElementById('detailContent');
  if (radarPanel && radarPanel.style.display !== 'none') {
    radarPanel.style.display = 'none';
    statsPanel.style.display = '';
  }
  document.querySelectorAll('#page-segmentasi .detail-tabs .dtab').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
  initDetailContent(idx);
};

window.switchDetailView = function (view, btn) {
  const radarPanel = document.getElementById('detailRadar');
  const statsPanel = document.getElementById('detailContent');

  if (view === 'radar') {
    statsPanel.style.display = 'none';
    radarPanel.style.display = 'flex';
    document.querySelectorAll('#page-segmentasi .detail-tabs .dtab').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
    if (typeof Chart === 'undefined') {
      radarPanel.querySelector('.radar-wrap').innerHTML = '<div class="chart-fallback">Radar tidak dapat dimuat (CDN Chart.js gagal).</div>';
      return;
    }
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
    if (val === null) return `<span style="font-size:12px;color:var(--green-text);font-weight:600"><i class="ti ti-check" style="font-size:12px"></i> Acuan (paling hemat)</span>`;
    const bad = inverse ? parseFloat(val) > 0 : parseFloat(val) < 0;
    const color = bad ? 'var(--red-text)' : 'var(--green-text)';
    const sign = parseFloat(val) > 0 ? '+' : '';
    return `<span style="font-size:12px;color:${color};font-weight:600">${sign}${val}${unit} vs acuan</span>`;
  };

  const recHTML = recForCluster.map(r => `
    <div style="padding:11px 0;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:5px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${r.rule}</span>
        <span class="kpi-badge-sm ${PRIO_CLASS[r.priority]}" style="flex-shrink:0">${PRIO_LABEL[r.priority]}</span>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${r.desc}</div>
      <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-muted);margin-top:2px">
        <i class="ti ti-trending-down" style="font-size:12px;color:${col.accent}"></i>
        <span style="font-family:'DM Mono',monospace;font-weight:600;color:${col.accent}">${r.gap}</span>
      </div>
    </div>
  `).join('');

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;padding-top:4px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div style="padding:12px 14px;background:${col.bg};border-radius:var(--radius-sm);text-align:center;border:1px solid ${col.accent}22">
          <div style="font-size:12px;font-weight:700;color:${col.text};margin-bottom:6px;letter-spacing:0.06em;text-transform:uppercase">kWh rata-rata</div>
          <div style="font-size:22px;font-weight:700;color:${col.accent};font-family:'DM Mono',monospace;letter-spacing:-0.02em;line-height:1">${kpi.usage}<span style="font-size:12px;font-weight:400;color:${col.text}"> kWh</span></div>
          <div style="margin-top:6px">${deltaTag(deltaKwh, '%')}</div>
        </div>
        <div style="padding:12px 14px;background:${col.bg};border-radius:var(--radius-sm);text-align:center;border:1px solid ${col.accent}22">
          <div style="font-size:12px;font-weight:700;color:${col.text};margin-bottom:6px;letter-spacing:0.06em;text-transform:uppercase">CO₂ rata-rata</div>
          <div style="font-size:22px;font-weight:700;color:${col.accent};font-family:'DM Mono',monospace;letter-spacing:-0.02em;line-height:1">${kpi.co2}<span style="font-size:12px;font-weight:400;color:${col.text}"> tCO₂</span></div>
          <div style="margin-top:6px">${deltaTag(deltaCo2, '%')}</div>
        </div>
        <div style="padding:12px 14px;background:${col.bg};border-radius:var(--radius-sm);text-align:center;border:1px solid ${col.accent}22">
          <div style="font-size:12px;font-weight:700;color:${col.text};margin-bottom:6px;letter-spacing:0.06em;text-transform:uppercase">PF Lagging</div>
          <div style="font-size:22px;font-weight:700;color:${col.accent};font-family:'DM Mono',monospace;letter-spacing:-0.02em;line-height:1">${kpi.pf}<span style="font-size:12px;font-weight:400;color:${col.text}">%</span></div>
          <div style="margin-top:6px">${deltaTag(deltaPf, ' poin', true)}</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.65;padding:12px 14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)">
        ${DATA.insights[idx]}
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:2px">
          Saran (${recForCluster.length})
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

  // Simulated hourly load profile (24h) - blend of all 3 clusters
  // Values 0-1 = relative load intensity
  const hourlyLoad = [
    0.18, 0.14, 0.12, 0.11, 0.13, 0.22,  // 00-05
    0.38, 0.55, 0.72, 0.82, 0.88, 0.91,  // 06-11
    0.87, 0.93, 0.98, 0.97, 0.89, 0.76,  // 12-17
    0.62, 0.54, 0.47, 0.40, 0.33, 0.25   // 18-23
  ];

  // Color interpolation: green (low) ke amber (mid) ke red (peak)
  const getColor = (v) => {
    if (v < 0.4) return `rgba(5,150,105,${0.4 + v * 0.8})`;
    if (v < 0.7) return `rgba(217,119,6,${0.5 + v * 0.5})`;
    return `rgba(220,38,38,${0.55 + v * 0.45})`;
  };

  el.innerHTML = hourlyLoad.map((v, i) => `
    <div class="thm-bar" title="${String(i).padStart(2, '0')}:00 - ${Math.round(v * 100)}% load"
      style="height:${Math.max(6, v * 48)}px;background:${getColor(v)}">
    </div>
  `).join('');
}


window.switchRecCluster = function (filterIdx, btn) {
  document.querySelectorAll('#page-rekomendasi .dtab').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
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
    grid.innerHTML = `<div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:var(--text-muted);background:var(--surface2);border-radius:14px;border:1px dashed var(--border-mid);margin-top:20px">
    <div style="margin-bottom:12px"><i class="ti ti-circle-check" style="font-size:36px;color:var(--green)"></i></div>
    <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px">Pola ini aman</div>
    <div style="font-size:13px;opacity:0.8">Tidak ada saran untuk saringan ini. Semua indikator normal.</div>
    </div>`;
    return;
  }

  grid.innerHTML = rules.map(r => {
    const col = DATA.clusterColors[r.cluster];
    return `
    <div class="rec-card prio-flag-${r.priority}">
      <div class="rc-top">
        <span class="rc-cluster" style="background:${col.bg};color:${col.text}">
          Cluster ${r.cluster}
        </span>
        <span class="rc-prio ${PRIO_CLASS[r.priority]}">
          <i class="ti ${r.priority === 'critical' ? 'ti-alert-triangle-filled' : r.priority === 'high' ? 'ti-alert-circle-filled' : 'ti-circle-check-filled'}" aria-hidden="true" style="font-size:12px"></i>
          ${PRIO_LABEL[r.priority]}
        </span>
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
  if (typeof Chart === 'undefined') {
    const wrap = ctx.parentElement;
    if (wrap) wrap.innerHTML = '<div class="chart-fallback">Profil 24 jam tidak dapat dimuat (CDN Chart.js gagal). Puncak 14.00–16.00, off-peak 22.00–05.00.</div>';
    return;
  }

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
        borderColor: '#0F766E', // var(--brand)
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        borderWidth: 2,
        tension: 0.4, // Smooth curve
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#0F766E'
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
          backgroundColor: '#0F172A',
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
            color: '#475569',
            font: { family: 'DM Mono', size: 12 },
            maxTicksLimit: 12
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(15, 118, 110, 0.08)',
            drawBorder: false,
          },
          ticks: {
            color: '#475569',
            font: { family: 'DM Mono', size: 12 },
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
  if (typeof Chart === 'undefined') return;

  const labels = ['kWh', 'PF Lagging', 'PF Leading', 'CO₂', 'NSM', 'Tipe Beban'];
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
          angleLines: { color: 'rgba(15,118,110,0.1)' },
          grid: { color: 'rgba(15,118,110,0.1)' },
          pointLabels: {
            color: '#475569',
            font: { family: 'DM Mono', size: 12 }
          },
          ticks: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          titleColor: '#FFFFFF',
          bodyColor: '#E5E7EB',
          titleFont: { family: 'DM Sans', size: 12, weight: '600' },
          bodyFont: { family: 'DM Mono', size: 11 },
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: items => items[0].label.replace('\n', ' - '),
            label: ctx => ` ${ctx.raw}`
          }
        }
      }
    }
  });
}