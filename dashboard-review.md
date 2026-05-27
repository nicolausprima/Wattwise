# Review Dashboard Wattwise

## ✅ Yang sudah bagus

| Aspek | Catatan |
|-------|---------|
| **Chart selection** | Bar (perbandingan), radar (multi-dimensi), doughnut (proporsi) — semua tepat |
| **Semantic color** | Hijau = C0 (baik), Biru = C1 (sedang), Merah = C2 (kritis) — konsisten di semua halaman |
| **Typography** | DM Sans untuk label, DM Mono untuk angka — sesuai best practice |
| **Aksesibilitas** | `aria-label` di semua canvas, teks alternatif di pie chart |
| **Data-Ink Ratio** | Minimal chart junk, gridlines halus, latar netral |
| **Interaktif** | Tab ganti metrik (kWh/CO₂/PF), filter cluster per halaman |
| **Layout** | CSS Grid dengan fraction units, sticky topbar, custom scrollbar |
| **Konteks** | Setiap chart punya `card-sub` yang menjelaskan isi |

## 🔴 Masalah kritis

1. **Merge conflict di `style.css:973-983`**
   Ada `<<<<<<< HEAD`, `=======`, `>>>>>>>58d618f`. CSS kebetulan tetap jalan karena duplikasi, tapi ini kode kotor dan rawan error.

2. **Semua data hardcoded**
   `main.js` tidak pernah panggil API. Chart dan rekomendasi statis. Jika ingin menyebut dashboard "data-driven", harus connect ke `POST /predict`.

## 🟡 Perlu diperbaiki

3. **Skala CO₂ membingungkan**
   Data `[1.5, 4.1, 13.8]` dengan label `"tCO₂ × 1000"`. Pembaca harus mikir dua kali. Lebih baik pakai nilai asli (`0.0015 tCO₂`) atau ganti label jadi `kgCO₂`.

4. **Urutan nomor halaman tidak konsisten**
   Nav: Dashboard → Segmentasi → CBF Rec (bertuliskan **01**) → Feat. Compare. Tapi di dalam halaman: Rekomendasi bertuliskan "01", Segmentasi "02". Konsistenkan atau hapus nomor saja.

5. **KPI badge "+12.3%" tidak ada konteks**
   Growth dari periode apa? Bisa menyesatkan tanpa baseline.

6. **Feature Snapshot duplikat**
   Ada di Dashboard (bottom-right) dan halaman Perbandingan. Isinya sama, redundant.

## 🟢 Saran opsional

7. **Doughnut → horizontal bar**
   Untuk 3 kategori, perbedaan 42% vs 25% lebih mudah dibaca di horizontal bar.

8. **Error bars di bar chart**
   Rata-rata tanpa distribusi bisa menyesatkan jika variasi dalam cluster besar.

9. **Siapkan loading state**
   Jika nanti connect ke API, perlu skeleton atau spinner.

---

**Kesimpulan:** Visual design solid — warna, tipografi, spacing, card system profesional. Masalah utama di **isi** (data hardcoded, merge conflict), bukan **tampilan**. Perlu ~1-2 jam bersihkan conflict + konekin ke API agar dashboard benar-benar live.
