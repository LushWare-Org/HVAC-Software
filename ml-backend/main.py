from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import shap
from datetime import datetime
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Database connection
DB_CONFIG = {
    "host": os.getenv('POSTGRES_HOST'),
    "port": int(os.getenv('POSTGRES_PORT')),
    "database": os.getenv('POSTGRES_DB'),
    "user": os.getenv('POSTGRES_USER'),
    "password": os.getenv('POSTGRES_PASSWORD')
}

app = FastAPI(title="HVAC ML Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "models")
model = joblib.load(os.path.join(MODEL_DIR, "hvac_xgb_model.pkl"))
feature_cols = joblib.load(os.path.join(MODEL_DIR, "feature_columns.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "hvac_scaler.pkl"))
explainer = shap.TreeExplainer(model)

fault_map = {
    0: "Normal",
    1: "Compressor Overheating",
    2: "Refrigerant Leak",
    3: "Condenser Fan Failure",
    4: "Filter Clog"
}

class SensorReading(BaseModel):
    equipment_id: str
    outdoor_temp: float
    return_air_temp: float
    supply_air_temp: float
    suction_pressure: float
    discharge_pressure: float
    suction_temp: float
    discharge_temp: float
    compressor_amps: float
    vibration: float
    filter_dp: float
    fan_speed: float

class AlertStatusUpdate(BaseModel):
    equipment_id: str
    status: str

def engineer_features(raw: dict) -> pd.DataFrame:
    df = pd.DataFrame([raw])
    df['pressure_ratio'] = df['discharge_pressure'] / (df['suction_pressure'] + 1e-6)
    df['superheat'] = df['suction_temp'] - 40
    df['subcooling'] = 120 - df['discharge_temp']
    df['delta_T'] = df['return_air_temp'] - df['supply_air_temp']
    for col in ['discharge_pressure', 'suction_pressure', 'compressor_amps', 'vibration']:
        df[f'{col}_rolling_mean'] = df[col]
        df[f'{col}_rolling_std'] = 0.0
    df['discharge_pressure_diff'] = 0.0
    df['vibration_diff'] = 0.0
    return df[feature_cols]

@app.post("/predict")
async def predict(reading: SensorReading):
    raw = reading.dict()
    eq_id = raw.pop("equipment_id")
    features = engineer_features(raw)
    X = features.values
    
    pred_class = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    confidence = float(proba[pred_class])
    
    shap_vals = explainer.shap_values(X)
    instance_shap = shap_vals[0, :, pred_class]
    top_idx = np.argsort(np.abs(instance_shap))[-3:][::-1]
    contributing = "; ".join([
        f"{feature_cols[i]}: {X[0,i]:.1f} ({'high' if instance_shap[i]>0 else 'low'})"
        for i in top_idx
    ])
    
    # Calculate severity based on fault type AND confidence
    predicted_fault = fault_map[pred_class]
    if predicted_fault == "Normal":
        severity = "low"
    elif confidence > 0.85:
        severity = "critical"
    elif confidence > 0.70:
        severity = "high"
    else:
        severity = "medium"
    
    return {
        "equipment_id": eq_id,
        "timestamp": datetime.now().isoformat(),
        "predicted_fault": predicted_fault,
        "confidence": confidence,
        "severity": severity,
        "contributing_factors": contributing,
        "recommended_action": "Check system" if pred_class > 0 else "Normal operation"
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}

@app.get("/ml/predictions/all")
def get_all_predictions_with_equipment(limit: int = 500):
    """
    Get all existing ML predictions from database with actual equipment details
    Joins with crm.equipment to fetch brand, model, and serial numbers
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Get predictions with equipment details via JOIN
        cur.execute("""
            SELECT DISTINCT ON (mp.equipment_id)
                mp.id, mp.equipment_id, mp.predicted_fault, mp.confidence, mp.severity, 
                mp.contributing_factors, mp.recommended_action, mp.created_at,
                e.brand, e.model, e."serialNo", e.type
            FROM ai_monitoring.ml_predictions mp
            LEFT JOIN crm.equipment e ON mp.equipment_id = e.id
            ORDER BY mp.equipment_id, mp.created_at DESC
            LIMIT %s
        """, (limit,))
        
        alerts = []
        for row in cur.fetchall():
            # Skip rows with "Normal" prediction only if we want to filter them
            # For now, we'll include all predictions
            if row[2] == "Normal":
                continue
                
            alerts.append({
                "id": row[0],
                "equipment_id": str(row[1]),
                "title": row[2],
                "predicted_fault": row[2],
                "description": f"{float(row[3])*100:.1f}% confidence",
                "severity": row[4],
                "status": "active",
                "created_at": row[7].isoformat() if row[7] else datetime.now().isoformat(),
                "confidence": float(row[3] or 0),
                "days_to_failure": max(1, int(30 * (1 - float(row[3] or 0) * 0.5))),
                "contributing_factors": row[5] or "N/A",
                "recommended_action": row[6] or "Monitor",
                "equipment": {
                    "brand": row[8] or "N/A",
                    "model": row[9] or "N/A",
                    "type": row[11] or "HVAC Unit",
                    "serial_number": row[10] or str(row[1])
                }
            })
        
        cur.close()
        conn.close()
        
        return alerts
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/latest-predictions")
def latest_predictions(limit: int = 1000):
    """Get latest ML predictions from all equipment"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Get latest prediction for each equipment
        cur.execute("""
            SELECT DISTINCT ON (equipment_id)
                equipment_id, predicted_fault, confidence, severity, 
                contributing_factors, recommended_action, timestamp
            FROM ai_monitoring.ml_predictions
            ORDER BY equipment_id, timestamp DESC
            LIMIT %s
        """, (limit,))
        
        predictions = []
        for row in cur.fetchall():
            predictions.append({
                "equipment_id": row[0],
                "predicted_fault": row[1],
                "confidence": row[2],
                "severity": row[3],
                "contributing_factors": row[4],
                "recommended_action": row[5],
                "timestamp": row[6].isoformat() if row[6] else None
            })
        
        cur.close()
        conn.close()
        
        return {"predictions": predictions, "count": len(predictions)}
    
    except Exception as e:
        return {"error": str(e), "predictions": []}

@app.get("/predictions/{equipment_id}")
def equipment_predictions(equipment_id: str, limit: int = 10):
    """Get prediction history for specific equipment"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT predicted_fault, confidence, severity, 
                   contributing_factors, recommended_action, timestamp
            FROM ai_monitoring.ml_predictions
            WHERE equipment_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """, (equipment_id, limit))
        
        predictions = []
        for row in cur.fetchall():
            predictions.append({
                "predicted_fault": row[0],
                "confidence": row[1],
                "severity": row[2],
                "contributing_factors": row[3],
                "recommended_action": row[4],
                "timestamp": row[5].isoformat() if row[5] else None
            })
        
        cur.close()
        conn.close()
        
        return {"equipment_id": equipment_id, "predictions": predictions}
    
    except Exception as e:
        return {"error": str(e), "predictions": []}

@app.get("/all-equipment")
def all_equipment(limit: int = 250):
    """Get all 246 equipment from the database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Get all equipment
        cur.execute("""
            SELECT id, brand, model, serial_number, location_name, city, customer_name
            FROM crm.equipment
            LIMIT %s
        """, (limit,))
        
        equipment = []
        for row in cur.fetchall():
            equipment.append({
                "id": row[0],
                "brand": row[1],
                "model": row[2],
                "serial_number": row[3],
                "location_name": row[4],
                "city": row[5],
                "customer_name": row[6],
            })
        
        cur.close()
        conn.close()
        
        return {"equipment": equipment, "count": len(equipment)}
    
    except Exception as e:
        return {"error": str(e), "equipment": []}

@app.put("/ml/predictions/{equipment_id}/status")
async def update_alert_status(equipment_id: str, status_update: AlertStatusUpdate):
    """Update alert status (acknowledged, resolved) in database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ai_monitoring.alert_status (
                id SERIAL PRIMARY KEY,
                equipment_id INTEGER,
                status VARCHAR(50),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(equipment_id)
            )
        """)
        
        # Insert or update status
        cur.execute("""
            INSERT INTO ai_monitoring.alert_status (equipment_id, status, updated_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (equipment_id) DO UPDATE SET status = %s, updated_at = CURRENT_TIMESTAMP
        """, (int(equipment_id), status_update.status, status_update.status))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"success": True, "equipment_id": equipment_id, "status": status_update.status}
    
    except Exception as e:
        print(f"❌ Error updating alert status: {e}")
        return {"success": False, "error": str(e)}