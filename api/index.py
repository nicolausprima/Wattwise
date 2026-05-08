from flask import Flask, request, jsonify
import pandas as pd
import joblib
import json
import os

# Inisialisasi aplikasi Flask (Vercel akan mencari variabel 'app' ini)
app = Flask(__name__)

# Konfigurasi path absolut agar aman saat di-deploy di Vercel
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# Load model dan aset secara global agar tidak di-load ulang setiap kali ada request
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
    return jsonify({
        "status": "success",
        "message": "Energy Recommendation API is running!"
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Ambil payload JSON dari request
        data = request.get_json()
        
        # 1. Konversi input menjadi DataFrame
        # Pastikan kolom sesuai dengan FEATURE_COLS saat proses training
        df = pd.DataFrame([data])
        
        # 2. Preprocessing (RobustScaler)
        df_scaled = pd.DataFrame(scaler.transform(df), columns=df.columns)
        
        # 3. Prediksi K-Means Cluster
        cluster_id = int(kmeans.predict(df_scaled)[0])
        cluster_name = cluster_names.get(str(cluster_id), f"Cluster {cluster_id}")
        
        # 4. Ambil rule rekomendasi yang relevan (contoh sederhana)
        # Logika cosine similarity bisa kamu tambahkan di sini sesuai notebook ke-4
        recommendations = [rule for rule in cbf_rules if rule['feature'] in df.columns]

        return jsonify({
            "status": "success",
            "cluster_id": cluster_id,
            "cluster_name": cluster_name,
            "input_data": data,
            "rules_applied": recommendations[:2] # Mengambil 2 rule prioritas teratas
        })

    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 400

# Tidak perlu menambahkan app.run(debug=True) di bagian bawah 
# karena Vercel yang akan mengeksekusi variabel 'app' secara serverless.