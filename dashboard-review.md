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

## ✅ Sudah diperbaiki

1. **Merge conflict di `style.css`** — sudah di-commit dan bersih ✅
2. **Footer naik saat konten pendek** — ditambahkan `flex: 1` pada `.content` agar footer tetap di bawah ✅
3. **Tech tags di footer** — tag detail teknis yang membingungkan telah dihapus ✅
4. **Skala CO₂ di bar chart** — diubah menjadi `kgCO₂` agar tidak membingungkan pembaca ✅
5. **Urutan nomor halaman** — disesuaikan (01 — Segmentasi, 02 — Rekomendasi, 03 — Feat. Compare) sesuai alur navigasi ✅
6. **KPI badge "+12.3%"** — ditambahkan konteks `MoM` dan tooltip penjelasan ✅
7. **Feature Snapshot duplikat** — diganti dengan card detail Konfigurasi Model ML di Dashboard ✅

## 🟢 Saran opsional (Untuk Pengembangan Selanjutnya)

1. **Doughnut → horizontal bar** — jika ingin visualisasi proporsi 3 kategori yang lebih linear.
2. **Error bars di bar chart** — untuk menampilkan distribusi jika variansi data cluster besar.
3. **Siapkan loading state** — skeleton loader jika nanti diintegrasikan dengan API dinamis.

---

**Kesimpulan:** Seluruh masalah visual dan inkonsistensi yang dilaporkan dalam review ini telah berhasil diperbaiki secara tuntas.
