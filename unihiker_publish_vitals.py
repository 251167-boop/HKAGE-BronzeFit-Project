#!/usr/bin/env python3
"""
UNIHIKER Heart Rate Publisher
Publishes fake heart rate data to SIoT MQTT broker for testing.

This script runs on the UNIHIKER device and publishes fake BPM data
to the symbinest/vital/heart topic every 2 seconds.
"""

import os
import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime

# Configuration from environment variables with defaults
MQTT_HOST = os.getenv("MQTT_HOST", "10.1.2.3")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "siot")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "dfrobot")
MQTT_TOPIC_PREFIX = os.getenv("MQTT_TOPIC_PREFIX", "symbinest")
DEVICE_ID = os.getenv("DEVICE_ID", "unihiker_01")

# Topic definitions
HEART_RATE_TOPIC = f"{MQTT_TOPIC_PREFIX}/vital/heart"

# TODO: Future topics for expansion
# EMERGENCY_TOPIC = f"{MQTT_TOPIC_PREFIX}/alert/emergency"
# POSTURE_TOPIC = f"{MQTT_TOPIC_PREFIX}/alert/posture"
# WARNING_CMD_TOPIC = f"{MQTT_TOPIC_PREFIX}/cmd/warning"


def on_connect(client, userdata, flags, rc):
    """Callback for when client connects to MQTT broker."""
    if rc == 0:
        print(f"✅ Connected to MQTT broker at {MQTT_HOST}:{MQTT_PORT}")
        print(f"   Using topic: {HEART_RATE_TOPIC}")
    else:
        print(f"❌ Connection failed with code: {rc}")


def on_disconnect(client, userdata, rc):
    """Callback for when client disconnects from MQTT broker."""
    if rc != 0:
        print(f"⚠️  Unexpected disconnection (code: {rc}), will retry...")


def on_publish(client, userdata, mid):
    """Callback for when message is published."""
    pass  # Silent for high-frequency publishing


def create_mqtt_client():
    """Create and configure MQTT client."""
    client = mqtt.Client()
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_publish = on_publish
    return client


def get_fake_bpm():
    """
    Generate fake heart rate data.
    
    Returns:
        int: BPM value (70-90 normally, occasionally 125-145 for testing)
    """
    # 90% of the time, return normal BPM (70-90)
    # 10% of the time, return high BPM (125-145) to test emergency UI
    if random.random() < 0.9:
        return random.randint(70, 90)
    else:
        return random.randint(125, 145)


def publish_heart_rate(client, bpm):
    """
    Publish heart rate data to MQTT topic.
    
    Args:
        client: MQTT client instance
        bpm: Heart rate in beats per minute
    """
    payload = {
        "device": DEVICE_ID,
        "bpm": bpm,
        "status": "active",
        "timestamp": int(time.time())
    }
    
    result = client.publish(HEART_RATE_TOPIC, json.dumps(payload), qos=1)
    
    if result.rc == 0:
        print(f"📤 Published to {HEART_RATE_TOPIC}: {json.dumps(payload)}")
    else:
        print(f"❌ Failed to publish (code: {result.rc})")


def main():
    """Main entry point."""
    print("=" * 60)
    print("UNIHIKER Heart Rate Publisher")
    print("=" * 60)
    print(f"Device ID: {DEVICE_ID}")
    print(f"MQTT Broker: {MQTT_HOST}:{MQTT_PORT}")
    print(f"Topic: {HEART_RATE_TOPIC}")
    print("-" * 60)
    
    # Create and connect MQTT client
    client = create_mqtt_client()
    
    try:
        client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
        client.loop_start()
        
        # Wait a moment for connection to establish
        time.sleep(2)
        
        print("✅ Publisher started. Press Ctrl+C to stop.")
        print("-" * 60)
        
        # Publish loop
        while True:
            bpm = get_fake_bpm()
            publish_heart_rate(client, bpm)
            time.sleep(2)  # Publish every 2 seconds
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping publisher...")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print("✅ Publisher stopped.")


if __name__ == "__main__":
    main()
