from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
import joblib
import json
import os
import traceback
from sklearn.metrics.pairwise import cosine_similarity

# Konfigurasi path absolut
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

# Variabel global model & artefak
scaler = None
kmeans = None
cluster_names = {}
ideal_profile = None
cluster_centers = None

# Load model dan artefak dengan aman
try:
    scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
    kmeans = joblib.load(os.path.join(MODEL_DIR, 'kmeans.pkl'))
    
    with open(os.path.join(MODEL_DIR, 'cluster_names.json'), 'r') as f:
        cluster_names = json.load(f)
        
    ideal_csv = os.path.join(PROCESSED_DIR, 'ideal_profile.csv')
    if os.path.exists(ideal_csv):
        ideal_profile = pd.read_csv(ideal_csv, index_col=0).squeeze()
        
    centers_csv = os.path.join(PROCESSED_DIR, 'cluster_centers.csv')
    if os.path.exists(centers_csv):
        cluster_centers = pd.read_csv(centers_csv)
    elif kmeans is not None and scaler is not None:
        cluster_centers = pd.DataFrame(kmeans.cluster_centers_, columns=list(scaler.feature_names_in_))
except Exception as e:
    print(f"Gagal memuat model/artefak: {e}")

# 8 Rules CBF resmi (sesuai notebooks/04_GenerateRecom.ipynb)
CBF_RULES = [
    {
        'feature': 'Lagging_Current_Power_Factor',
        'condition': lambda actual, ideal: actual < ideal - 0.3,
        'message': lambda actual, ideal: f'Lagging PF ({actual:.3f}) di bawah acuan efisien ({ideal:.3f}). Gap: {ideal - actual:.3f} — pasang capacitor bank untuk kompensasi daya reaktif lagging.',
        'priority': 1
    },
    {
        'feature': 'Leading_Current_Power_Factor',
        'condition': lambda actual, ideal: actual < -50,
        'message': lambda actual, ideal: f'Leading PF ({actual:.3f} scaled) terdeteksi anjlok drastis di bawah normal 100%. Periksa kapasitor bank atau beban induktif sistem.',
        'priority': 1
    },
    {
        'feature': 'Usage_kWh',
        'condition': lambda actual, ideal: actual > ideal + 0.3,
        'message': lambda actual, ideal: f'Konsumsi aktif Usage_kWh ({actual:.3f} scaled) melampaui batas efisien ({ideal:.3f}). Gap: {actual - ideal:.3f} — lakukan audit beban aktif puncak.',
        'priority': 1
    },
    {
        'feature': 'CO2(tCO2)',
        'condition': lambda actual, ideal: actual > ideal + 0.3,
        'message': lambda actual, ideal: f'Emisi CO2 ({actual:.3f} scaled) di atas acuan efisien ({ideal:.3f}). Evaluasi efisiensi konversi daya atau sumber energi.',
        'priority': 2
    },
    {
        'feature': 'Lagging_Current_Reactive.Power_kVarh',
        'condition': lambda actual, ideal: actual > ideal + 0.5,
        'message': lambda actual, ideal: f'Daya reaktif lagging ({actual:.3f} kVarh) tinggi di atas acuan ({ideal:.3f}). Kurangi rugi jaringan dengan kompensasi daya reaktif.',
        'priority': 2
    },
    {
        'feature': 'Leading_Current_Reactive_Power_kVarh',
        'condition': lambda actual, ideal: actual < ideal - 0.5,
        'message': lambda actual, ideal: f'Daya reaktif leading ({actual:.3f} kVarh) di bawah acuan ({ideal:.3f}). Sesuaikan step kapasitor pada distribusi listrik.',
        'priority': 3
    },
    {
        'feature': 'NSM',
        'condition': lambda actual, ideal: actual > ideal + 0.5,
        'message': lambda actual, ideal: f'Waktu operasional (NSM={actual:.3f}) terjadi pada jam puncak (peak). Lakukan load shifting ke jam off-peak.',
        'priority': 2
    },
    {
        'feature': 'is_weekend',
        'condition': lambda actual, ideal: actual < 0.5 and ideal >= 0.5,
        'message': lambda actual, ideal: f'Operasional berjalan pada hari kerja dengan beban tinggi. Alihkan maintenance berat mesin ke akhir pekan.',
        'priority': 3
    }
]

@app.route('/', methods=['GET'])
def home():
    index_file = os.path.join(FRONTEND_DIR, 'index.html')
    if os.path.exists(index_file):
        return send_from_directory(FRONTEND_DIR, 'index.html')
    return jsonify({"status": "success", "message": "Energy Recommendation API is running!"})

@app.route('/api', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def api_status():
    return jsonify({"status": "success", "message": "Energy Recommendation API is running!"})

@app.route('/predict', methods=['OPTIONS'])
@app.route('/api/predict', methods=['OPTIONS'])
def predict_options():
    return ('', 204)

@app.route('/predict', methods=['POST'])
@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json() or {}
        df = pd.DataFrame([data])
        expected = list(scaler.feature_names_in_)
        missing = [c for c in expected if c not in df.columns]
        if missing:
            return jsonify({
                "status": "error",
                "message": f"Kolom hilang: {', '.join(missing)}"
            }), 400
        
        df = df[expected].astype(float)
        
        # Log-transform (np.log1p) pada 4 fitur skewed sesuai pipeline 02_Preprocessing
        LOG_COLS = ['Usage_kWh', 'Lagging_Current_Reactive.Power_kVarh', 'Leading_Current_Reactive_Power_kVarh', 'CO2(tCO2)']
        df_log = df.copy()
        for col in LOG_COLS:
            if col in df_log.columns:
                df_log[col] = np.log1p(np.maximum(df_log[col], 0.0))
        
        df_scaled = pd.DataFrame(scaler.transform(df_log), columns=expected)
        
        # 1. Prediksi K-Means
        cluster_id = int(kmeans.predict(df_scaled)[0])
        cluster_name = cluster_names.get(str(cluster_id), f"Cluster {cluster_id}")
        
        # 2. Hitung Cosine Similarity ke masing-masing centroid
        sim_scores = {}
        if cluster_centers is not None:
            sims = cosine_similarity(df_scaled.values, cluster_centers[expected].values)[0]
            sim_scores = {str(i): round(float(s), 4) for i, s in enumerate(sims)}
            
        # 3. Evaluasi Gap & CBF Rules terhadap ideal_profile
        triggered_recs = []
        feature_gaps = {}
        row_scaled = df_scaled.iloc[0]
        
        if ideal_profile is not None:
            for feat in expected:
                actual = float(row_scaled[feat])
                ideal = float(ideal_profile[feat])
                feature_gaps[feat] = round(actual - ideal, 4)
            
            for rule in CBF_RULES:
                feat = rule['feature']
                actual = float(row_scaled[feat])
                ideal = float(ideal_profile[feat])
                if rule['condition'](actual, ideal):
                    triggered_recs.append({
                        'feature': feat,
                        'priority': rule['priority'],
                        'message': rule['message'](actual, ideal),
                        'gap': round(abs(actual - ideal), 4)
                    })
        
        # Urutkan: prioritas ASC (P1 teratas), gap terbesar duluan
        triggered_recs.sort(key=lambda x: (x['priority'], -x['gap']))
        
        if not triggered_recs:
            triggered_recs.append({
                'feature': '-',
                'priority': 3,
                'message': 'Profil konsumsi energi record ini sudah efisien dan mendekati acuan ideal.',
                'gap': 0.0
            })
            
        return jsonify({
            "status": "success",
            "cluster_id": cluster_id,
            "cluster_name": cluster_name,
            "similarity_scores": sim_scores,
            "feature_gaps": feature_gaps,
            "rules_applied": triggered_recs
        })

    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e),
            "trace": traceback.format_exc()
        }), 400

# Wajib ada untuk Vercel mengenali Flask app
app.debug = False

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Server berjalan di: http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
