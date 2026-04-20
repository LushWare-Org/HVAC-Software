#!/usr/bin/env python3
"""
MQTT Consumer Service - Listens to MQTT and calls ML API for predictions
Stores predictions in PostgreSQL database
Bridges IoT data → ML predictions → Dashboard
"""

import paho.mqtt.client as mqtt
import json
import requests
import psycopg2
from datetime import datetime
import time
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration - Use environment variables for Docker support
MQTT_BROKER = os.getenv('MQTT_BROKER', 'localhost')
MQTT_PORT = int(os.getenv('MQTT_PORT', 1883))
MQTT_TOPIC = "hvac/equipment/+/sensor_data"
ML_API_URL = os.getenv('ML_API_URL', 'http://localhost:8000/predict')

# PostgreSQL connection
DB_CONFIG = {
    "host": os.getenv('POSTGRES_HOST'),
    "port": int(os.getenv('POSTGRES_PORT')),
    "database": os.getenv('POSTGRES_DB'),
    "user": os.getenv('POSTGRES_USER'),
    "password": os.getenv('POSTGRES_PASSWORD')
}


class MQTTConsumer:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        self.reading_count = 0
        self.prediction_count = 0
        self.error_count = 0
        
        # Ensure predictions table exists
        self.init_database()
    
    def init_database(self):
        """Create predictions table if it doesn't exist"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            # Create predictions table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ai_monitoring.ml_predictions (
                    id SERIAL PRIMARY KEY,
                    equipment_id VARCHAR(255) NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    predicted_fault VARCHAR(255),
                    confidence FLOAT,
                    severity VARCHAR(50),
                    contributing_factors TEXT,
                    recommended_action TEXT,
                    raw_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create index for faster queries
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_ml_predictions_equipment_time 
                ON ai_monitoring.ml_predictions(equipment_id, timestamp DESC)
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info("✅ Database initialized - predictions table ready")
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            raise
    
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info(f"✅ Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
            # Subscribe to MQTT topic
            client.subscribe(MQTT_TOPIC)
            logger.info(f"📡 Subscribed to topic: {MQTT_TOPIC}")
        else:
            logger.error(f"❌ Connection failed with code {rc}")
    
    def on_message(self, client, userdata, msg):
        """Called when MQTT message is received"""
        try:
            self.reading_count += 1
            
            # Parse MQTT message
            payload = json.loads(msg.payload.decode())
            equipment_id = payload.get('equipment_id')
            
            # Extract sensors
            sensors = payload.get('sensors', {})
            
            # Prepare data for ML API
            ml_data = {
                'equipment_id': equipment_id,
                'outdoor_temp': sensors.get('outdoor_temp', 75),
                'return_air_temp': sensors.get('return_air_temp', 72),
                'supply_air_temp': sensors.get('supply_air_temp', 55),
                'suction_pressure': sensors.get('suction_pressure', 120),
                'discharge_pressure': sensors.get('discharge_pressure', 380),
                'suction_temp': sensors.get('suction_temp', 50),
                'discharge_temp': sensors.get('discharge_temp', 170),
                'compressor_amps': sensors.get('compressor_amps', 12),
                'vibration': sensors.get('vibration', 2),
                'filter_dp': sensors.get('filter_dp', 0.2),
                'fan_speed': sensors.get('fan_speed', 1700),
            }
            
            # Call ML API for prediction
            response = requests.post(ML_API_URL, json=ml_data, timeout=5)
            
            if response.status_code == 200:
                prediction = response.json()
                
                # Store prediction in database
                self.store_prediction(equipment_id, prediction, ml_data)
                self.prediction_count += 1
                
                # Log every 50 predictions
                if self.prediction_count % 50 == 0:
                    logger.info(f"✅ Processed {self.prediction_count} predictions | MQTT readings: {self.reading_count}")
                
            else:
                logger.warning(f"⚠️ ML API error for {equipment_id}: {response.status_code}")
                self.error_count += 1
        
        except json.JSONDecodeError:
            logger.warning("⚠️ Failed to parse MQTT message")
            self.error_count += 1
        except requests.RequestException as e:
            logger.warning(f"⚠️ ML API request failed: {e}")
            self.error_count += 1
        except Exception as e:
            logger.error(f"❌ Error processing MQTT message: {e}")
            self.error_count += 1
    
    def store_prediction(self, equipment_id, prediction, raw_data):
        """Store ML prediction in database"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO ai_monitoring.ml_predictions 
                (equipment_id, predicted_fault, confidence, severity, 
                 contributing_factors, recommended_action, raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                equipment_id,
                prediction.get('predicted_fault', 'Unknown'),
                prediction.get('confidence', 0),
                prediction.get('severity', 'low'),
                prediction.get('contributing_factors', ''),
                prediction.get('recommended_action', ''),
                json.dumps({**raw_data, **prediction})
            ))
            
            conn.commit()
            cur.close()
            conn.close()
        
        except Exception as e:
            logger.error(f"❌ Failed to store prediction: {e}")
    
    def on_disconnect(self, client, userdata, rc):
        if rc != 0:
            logger.warning(f"⚠️ Unexpected disconnection (code {rc})")
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            self.client.loop_start()
            logger.info("🚀 MQTT Consumer started")
            time.sleep(1)  # Wait for connection
        except Exception as e:
            logger.error(f"❌ Failed to connect: {e}")
            raise
    
    def run(self):
        """Main loop"""
        print("\n" + "="*80)
        print("MQTT CONSUMER SERVICE - Real-Time ML Predictions")
        print("="*80)
        print(f"\nConfiguration:")
        print(f"  MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
        print(f"  Topic: {MQTT_TOPIC}")
        print(f"  ML API: {ML_API_URL}")
        print(f"  Database: {DB_CONFIG['database']}")
        print(f"\nListening for MQTT messages...")
        print(f"Predictions stored in: ai_monitoring.ml_predictions")
        print("="*80 + "\n")
        
        self.connect()
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("\n✅ Shutting down MQTT Consumer...")
            self.client.loop_stop()
            self.client.disconnect()
            print(f"\nFinal Statistics:")
            print(f"  MQTT Messages Received: {self.reading_count}")
            print(f"  ML Predictions Stored: {self.prediction_count}")
            print(f"  Errors: {self.error_count}")


if __name__ == '__main__':
    consumer = MQTTConsumer()
    consumer.run()
