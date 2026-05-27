# Wattwise — Energy Intelligence Dashboard

## Commands

```bash
pip install -r requirements.txt    # no lockfile — bare package names, no version pins
python api/index.py                # Flask on http://localhost:5000
python generate_plots.py           # poster charts → images/ (5 PNGs)
```

No tests, linters, formatters, typecheckers, or CI. Only config files: `vercel.json`, `requirements.txt`. `README.md` is empty.

## Structure

```
api/index.py              # Flask app, 2 routes: GET /, POST /predict
frontend/index.html       # SPA (assets/{css/style.css, js/main.js})
data/raw/                 # Steel_industry_data.csv (used); Wholesale customers data.csv (unused)
data/processed/           # 9 CSV artifacts from notebooks (scaled, clustered, recommendations)
models/                   # scaler.pkl, kmeans.pkl, cluster_names.json, cbf_rules_meta.json
notebooks/                # Run in order: 01_EDA → 02_Preprocessing → 03_Modeling → 04_GenerateRecom
generate_plots.py         # matplotlib poster-quality charts
images/                   # 5 generated plot PNGs
```

Empty tracked dirs use `.gitkeep`.

## API quirks

- **Models load at import time** (module level, not lazy). If loading fails, globals stay `None`.
- `POST /predict` accepts a flat JSON object matching the 10 scaled columns exactly (names must match `scaler.feature_names_in_`):
  `Usage_kWh`, `Lagging_Current_Reactive.Power_kVarh`, `Leading_Current_Reactive_Power_kVarh`, `CO2(tCO2)`, `Lagging_Current_Power_Factor`, `Leading_Current_Power_Factor`, `NSM`, `hour`, `month`, `is_weekend`
- Returns `{cluster_id, cluster_name, rules_applied}`. Rules are the first 2 entries from `cbf_rules_meta.json` only (feature + priority fields; conditions are NOT evaluated dynamically).
- `app.debug = False` required for Vercel (set at `index.py:90`).

## ML Pipeline

- **Scaler**: `RobustScaler` (fitted in 02_Preprocessing).
- **Clustering**: `KMeans(k=3)`. Clusters: 0=Low Load - Idle, 1=Medium Load - Night Shift, 2=High Load - Day Shift.
- **CBF**: Cosine similarity to centroids + gap analysis vs ideal profile (median of cluster 0). 8 rules, priorities 1–3.
- **Train/Test split**: 80/20.

## Key quirks

- **No `.gitignore`** — pickles, large CSVs, and notebook outputs are all tracked.
- **Unfinished interactive rebase** on `main` — 1 commit remaining (`.git/rebase-merge/msgnum=1, end=1`). Do not commit without resolving first.
- **Frontend data is hardcoded** in `main.js` — Chart.js values are static demos, not live API responses. `assets/data/` is empty.
- **`matplotlib` and `seaborn`** used in notebooks + `generate_plots.py` but missing from `requirements.txt`.
