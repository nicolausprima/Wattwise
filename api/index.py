from flask import Flask, request, jsonify
import pandas as pd
import joblib
import json
import os
import traceback

app = Flask(__name__)

# Konfigurasi path absolut
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# Variabel global
scaler = None
kmeans = None
cluster_names = {}
cbf_rules = []

# Load model dengan aman
try:
    scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
    kmeans = joblib.load(os.path.join(MODEL_DIR, 'kmeans.pkl'))
    
    with open(os.path.join(MODEL_DIR, 'cluster_names.json'), 'r') as f:
        cluster_names = json.load(f)
        
    with open(os.path.join(MODEL_DIR, 'cbf_rules_meta.json'), 'r') as f:
        cbf_rules = json.load(f)
except Exception as e:
    print(f"Gagal memuat model: {e}")

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "success", "message": "Energy Recommendation API is running!"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Ambil payload & Preprocessing
        data = request.get_json()
        df = pd.DataFrame([data])
        df_scaled = pd.DataFrame(scaler.transform(df), columns=df.columns)
        
        # 2. Prediksi K-Means
        cluster_id = int(kmeans.predict(df_scaled)[0])
        
        # 3. Ambil nama klaster (Aman dari error Dictionary/List)
        if isinstance(cluster_names, dict):
            cluster_name = cluster_names.get(str(cluster_id), f"Cluster {cluster_id}")
        elif isinstance(cluster_names, list):
            cluster_name = cluster_names[cluster_id] if cluster_id < len(cluster_names) else f"Cluster {cluster_id}"
        else:
            cluster_name = f"Cluster {cluster_id}"
        
        # 4. Ambil rule rekomendasi (DIUBAH AGAR ANTI-ERROR)
        recommendations = []
        if isinstance(cbf_rules, list):
            # Ambil maksimal 2 rule teratas saja
            for rule in cbf_rules[:2]: 
                if isinstance(rule, dict) and 'feature' in rule:
                    recommendations.append(rule)
                else:
                    # Jika ternyata isinya hanya list biasa/string, ubah jadi dict agar frontend tidak bingung
                    recommendations.append({"feature": str(rule), "priority": "-"})
                    
        elif isinstance(cbf_rules, dict):
            # Jika file JSON ternyata dikelompokkan berdasarkan cluster_id
            if str(cluster_id) in cbf_rules:
                recs = cbf_rules[str(cluster_id)]
                if isinstance(recs, list):
                    recommendations = [{"feature": str(r), "priority": "-"} for r in recs[:2]]

        return jsonify({
            "status": "success",
            "cluster_id": cluster_id,
            "cluster_name": cluster_name,
            "rules_applied": recommendations
        })

    except Exception as e:
        # Jika masih error, kirim detail baris errornya ke layar web-mu
        return jsonify({
            "status": "error", 
            "message": f"{str(e)}",
            "trace": traceback.format_exc()
        }), 400
