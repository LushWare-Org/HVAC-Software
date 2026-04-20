#!/usr/bin/env python3
"""
IoT Sensor Simulator - Generates realistic HVAC sensor data
Sends to MQTT broker for real-time ML predictions

Modes:
  - Demo: Manual anomaly injection via keyboard (default)
  - Production: Automatic anomalies, headless, 24/7
"""

import paho.mqtt.client as mqtt
import json
import random
import time
from datetime import datetime
import sys
import argparse
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MQTT Configuration
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "hvac/equipment/+/sensor_data"

# Sensor configurations with realistic ranges
SENSORS = {
    'outdoor_temp': {'min': 70, 'max': 100, 'unit': '°F'},
    'return_air_temp': {'min': 68, 'max': 78, 'unit': '°F'},
    'supply_air_temp': {'min': 45, 'max': 65, 'unit': '°F'},
    'suction_pressure': {'min': 80, 'max': 150, 'unit': 'psi'},
    'discharge_pressure': {'min': 300, 'max': 450, 'unit': 'psi'},
    'suction_temp': {'min': 40, 'max': 60, 'unit': '°F'},
    'discharge_temp': {'min': 150, 'max': 200, 'unit': '°F'},
    'compressor_amps': {'min': 5, 'max': 18, 'unit': 'A'},
    'vibration': {'min': 1.0, 'max': 3.0, 'unit': 'mm/s'},
    'filter_dp': {'min': 0.1, 'max': 0.5, 'unit': 'inH2O'},
    'fan_speed': {'min': 1500, 'max': 1900, 'unit': 'RPM'},
}

def load_equipment_ids():
    """Load all 246 equipment IDs from PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            port=int(os.getenv('POSTGRES_PORT')),
            database=os.getenv('POSTGRES_DB'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD')
        )
        cur = conn.cursor()
        cur.execute('SELECT id FROM crm.equipment ORDER BY id')
        equipment_ids = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()
        
        print(f"✅ Loaded {len(equipment_ids)} equipment IDs from database")
        return equipment_ids
    except Exception as e:
        print(f"❌ Failed to load equipment IDs: {e}")
        print("Make sure PostgreSQL is running and .env is configured")
        sys.exit(1)

# Load all 246 equipment IDs from database
EQUIPMENT_IDS = load_equipment_ids()

class IoTSimulator:
    def __init__(self, production_mode=False):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.sensor_state = {}
        self.anomaly_equipment = set()
        self.reading_count = 0
        self.production_mode = production_mode
        self.anomaly_chance = 0.1 if production_mode else 0  # 10% chance in production
        self.last_anomaly_change = {}
        
        # Initialize sensor states for each equipment
        for eq_id in EQUIPMENT_IDS:
            self.sensor_state[eq_id] = {
                sensor: random.uniform(config['min'], config['max'])
                for sensor, config in SENSORS.items()
            }
    
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"✅ Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        else:
            print(f"❌ Connection failed with code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        print(f"Disconnected from MQTT broker (code: {rc})")
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            self.client.loop_start()
            time.sleep(1)  # Wait for connection
        except Exception as e:
            print(f"❌ Failed to connect to MQTT broker: {e}")
            print("Make sure Docker is running: docker-compose up -d")
            sys.exit(1)
    
    def generate_sensor_reading(self, equipment_id):
        """Generate realistic sensor reading with optional anomalies"""
        reading = {
            'equipment_id': equipment_id,
            'timestamp': datetime.now().isoformat(),
            'sensors': {}
        }
        
        # Simulate anomalies for certain equipment
        is_anomalous = equipment_id in self.anomaly_equipment
        
        for sensor_name, config in SENSORS.items():
            current_val = self.sensor_state[equipment_id][sensor_name]
            
            # Random walk with drift
            drift = random.gauss(0, 0.5)
            new_val = current_val + drift
            
            # Inject anomalies
            if is_anomalous:
                if sensor_name == 'discharge_pressure':
                    new_val = random.uniform(420, 480)  # ABNORMALLY HIGH
                elif sensor_name == 'vibration':
                    new_val = random.uniform(2.8, 3.5)  # ABNORMALLY HIGH
                elif sensor_name == 'filter_dp':
                    new_val = random.uniform(0.45, 0.6)  # ABNORMALLY HIGH
            
            # Clamp to valid range
            new_val = max(config['min'], min(config['max'], new_val))
            self.sensor_state[equipment_id][sensor_name] = new_val
            
            reading['sensors'][sensor_name] = round(new_val, 2)
        
        return reading
    
    def inject_anomaly(self, equipment_id):
        """Start injecting anomalies for an equipment"""
        if equipment_id not in self.anomaly_equipment:
            self.anomaly_equipment.add(equipment_id)
            print(f"  🚨 Anomaly injected for {equipment_id}")
    
    def clear_anomaly(self, equipment_id):
        """Stop injecting anomalies for an equipment"""
        if equipment_id in self.anomaly_equipment:
            self.anomaly_equipment.remove(equipment_id)
            print(f"  ✅ Anomaly cleared for {equipment_id}")
    
    def publish_reading(self, reading):
        """Publish sensor reading to MQTT"""
        equipment_id = reading['equipment_id']
        topic = f"hvac/equipment/{equipment_id}/sensor_data"
        payload = json.dumps(reading)
        
        try:
            self.client.publish(topic, payload, qos=1)
            self.reading_count += 1
            
            # Print progress every 50 readings
            if self.reading_count % 50 == 0:
                anomalous = len(self.anomaly_equipment)
                print(f"[{self.reading_count:5d}] Published • Normal: {len(EQUIPMENT_IDS)-anomalous} • Anomalous: {anomalous}")
                if self.anomaly_equipment:
                    print(f"       Anomalous equipment: {', '.join(sorted(self.anomaly_equipment))}")
            
            return True
        except Exception as e:
            print(f"❌ Failed to publish: {e}")
            return False
    
    def run(self):
        """Main simulation loop"""
        print("\n" + "="*80)
        print("IoT SENSOR SIMULATOR - HVAC Real-Time Data Generator")
        print("="*80)
        print(f"\nMode: {'🚀 PRODUCTION (Automatic Anomalies)' if self.production_mode else '🧪 DEMO (Manual Control)'}")
        print(f"🌐 Simulating ALL {len(EQUIPMENT_IDS)} REAL equipment from database")
        print(f"MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
        print(f"Publishing to: hvac/equipment/+/sensor_data")
        
        if self.production_mode:
            print("\n🔧 Production Configuration:")
            print(f"  - Equipment: All {len(EQUIPMENT_IDS)} real HVAC units")
            print("  - Sending: Random equipment every 0.5 seconds")
            print("  - Automatic anomaly injection: 5% chance per equipment")
            print("  - Headless mode (no keyboard input)")
            print("  - Running 24/7")
            print("  - Ctrl+C to stop")
        else:
            print("\nControls (Demo Mode):")
            print("  Type equipment ID to toggle anomaly (e.g., 'eq-0001')")
            print("  Press 'q' to quit")
        
        print("\n" + "="*80 + "\n")
        
        self.connect()
        
        reading_interval = 0.5  # Send reading every 0.5 seconds (to random equipment)
        last_reading_time = time.time()
        last_anomaly_update = time.time()
        self.anomaly_chance = 0.05 if self.production_mode else 0  # 5% chance (lower for 246 equipment)
        
        try:
            while True:
                current_time = time.time()
                
                # Automatic anomaly injection (production mode only)
                if self.production_mode and (current_time - last_anomaly_update) >= 60:  # Update every 60 seconds
                    for eq_id in EQUIPMENT_IDS:
                        if random.random() < self.anomaly_chance:
                            if eq_id not in self.anomaly_equipment:
                                self.inject_anomaly(eq_id)
                        else:
                            if eq_id in self.anomaly_equipment:
                                self.clear_anomaly(eq_id)
                    last_anomaly_update = current_time
                
                # Publish reading to random equipment (more realistic for 246 units)
                if current_time - last_reading_time >= reading_interval:
                    equipment_id = random.choice(EQUIPMENT_IDS)  # Random equipment
                    reading = self.generate_sensor_reading(equipment_id)
                    self.publish_reading(reading)
                    
                    last_reading_time = current_time
                
                # Check for user input (demo mode only)
                if not self.production_mode:
                    try:
                        import select
                        if sys.stdin in select.select([sys.stdin], [], [], 0)[0]:
                            user_input = sys.stdin.readline().strip().lower()
                            if user_input == 'q':
                                print("\n✅ Shutting down simulator...")
                                break
                            elif user_input.startswith('eq-'):
                                # Allow toggling specific equipment by ID
                                if user_input in EQUIPMENT_IDS:
                                    if user_input in self.anomaly_equipment:
                                        self.clear_anomaly(user_input)
                                    else:
                                        self.inject_anomaly(user_input)
                                else:
                                    print(f"❌ Equipment {user_input} not found")
                    except Exception:
                        # Non-blocking input not available on this platform
                        pass
                
                time.sleep(0.01)
        
        except KeyboardInterrupt:
            print("\n\n✅ Simulator stopped by user")
        finally:
            self.client.loop_stop()
            self.client.disconnect()
            print(f"Total readings published: {self.reading_count}")
            print("\n")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='IoT Sensor Simulator for HVAC System')
    parser.add_argument('--production', action='store_true', 
                       help='Run in production mode (automatic anomalies, headless)')
    args = parser.parse_args()
    
    simulator = IoTSimulator(production_mode=args.production)
    simulator.run()
