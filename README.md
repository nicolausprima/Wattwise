# Wattwise — Energy Intelligence Dashboard

Wattwise is an energy intelligence dashboard and recommendation system designed to analyze power consumption patterns, specifically tailored for industrial energy data. It uses machine learning clustering to categorize energy usage and a Content-Based Filtering (CBF) approach to recommend energy-saving rules.

## Features

- **Energy Usage Clustering**: Groups energy consumption into three distinct clusters:
  - `0`: Low Load - Idle
  - `1`: Medium Load - Night Shift
  - `2`: High Load - Day Shift
- **Recommendation Engine**: Uses cosine similarity and gap analysis against an ideal profile to suggest energy-saving actions based on priority.
- **RESTful API**: Flask-based backend providing endpoints for predictions.
- **Frontend Dashboard**: Single Page Application (SPA) to visualize energy usage data (currently using static demo data for charts).
- **Automated Plotting**: Generates poster-quality charts summarizing EDA and model results.

## Project Structure

```text
Wattwise/
├── api/
│   └── index.py              # Flask app backend
├── frontend/
│   └── index.html            # SPA dashboard (assets/css/style.css, assets/js/main.js)
├── data/
│   ├── raw/                  # Raw dataset (Steel_industry_data.csv)
│   └── processed/            # Processed data, scaled values, and generated recommendations
├── models/                   # Pickled ML models (scaler.pkl, kmeans.pkl) and JSON metadata
├── notebooks/                # Jupyter notebooks for the ML pipeline
│   ├── 01_EDA.ipynb          
│   ├── 02_Preprocessing.ipynb
│   ├── 03_Modeling.ipynb     
│   └── 04_GenerateRecom.ipynb
├── images/                   # Generated plot PNGs
└── generate_plots.py         # Script to generate matplotlib poster-quality charts
```

## Setup & Installation

1. **Install Dependencies**:
   Install the required packages. Note that `matplotlib` and `seaborn` are also required if you wish to run the notebooks or plot generation script.
   ```bash
   pip install -r requirements.txt
   pip install matplotlib seaborn  # Required for notebooks and plotting
   ```

2. **Run the API Server**:
   Start the Flask application (runs on `http://localhost:5000`).
   ```bash
   python api/index.py
   ```

3. **Generate Plots** (Optional):
   Re-generate the 5 poster-quality PNG charts in the `images/` directory.
   ```bash
   python generate_plots.py
   ```

4. **Frontend Dashboard**:
   Open `frontend/index.html` in your web browser. Note that chart data is currently hardcoded for demonstration purposes.

## ML Pipeline Workflow

To reproduce the machine learning models and data processing artifacts, run the notebooks in the `notebooks/` directory in the following order:

1. `01_EDA` - Exploratory Data Analysis
2. `02_Preprocessing` - Data cleaning and scaling (fits `RobustScaler`)
3. `03_Modeling` - K-Means clustering (k=3)
4. `04_GenerateRecom` - Generates CBF recommendation rules and metadata

## API Usage

### `POST /predict`

Accepts a flat JSON object matching the 10 scaled features:
- `Usage_kWh`
- `Lagging_Current_Reactive.Power_kVarh`
- `Leading_Current_Reactive_Power_kVarh`
- `CO2(tCO2)`
- `Lagging_Current_Power_Factor`
- `Leading_Current_Power_Factor`
- `NSM`
- `hour`
- `month`
- `is_weekend`

**Example Request:**
```json
{
  "Usage_kWh": 0.5,
  "Lagging_Current_Reactive.Power_kVarh": 0.2,
  "Leading_Current_Reactive_Power_kVarh": 0.1,
  "CO2(tCO2)": 0.05,
  "Lagging_Current_Power_Factor": 0.8,
  "Leading_Current_Power_Factor": 0.9,
  "NSM": 36000,
  "hour": 10,
  "month": 7,
  "is_weekend": 0
}
```

**Example Response:**
```json
{
  "cluster_id": 2,
  "cluster_name": "High Load - Day Shift",
  "rules_applied": [
    {"feature": "Usage_kWh", "priority": 1},
    {"feature": "NSM", "priority": 2}
  ]
}
```
*Note: The API loads models at module import time and requires exactly matching feature names.*