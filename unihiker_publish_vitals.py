#!/usr/bin/env python3
"""
UNIHIKER Heart Rate Publisher
Publishes fake heart rate data to SIoT MQTT broker for testing.

This script runs on the UNIHIKER device and publishes fake BPM data
to the symbinest/vital/heart topic every 2 seconds.
"""

import json
import os
import random
import time

import paho.mqtt.client as mqtt

# Configuration from environment variables with defaults
# When this script runs on the UNIHIKER itself, the SIoT broker is local.
MQTT_HOST = os.getenv("MQTT_HOST", "127.0.0.1")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "siot")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "dfrobot")
MQTT_TOPIC_PREFIX = os.getenv("MQTT_TOPIC_PREFIX", "symbinest")
DEVICE_ID = os.getenv("DEVICE_ID", "unihiker_01")
CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "siot_python_client")
LEGACY_HEARTBEAT_TOPIC = os.getenv("MQTT_LEGACY_HEARTBEAT_TOPIC", "Heartbeat/Beat")
PUBLISH_LEGACY_TOPIC = os.getenv("PUBLISH_LEGACY_TOPIC", "true").lower() == "true"

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
    else:
        print("[INFO] Disconnected from SIoT server.")


def on_publish(client, userdata, mid):
    """Callback for when message is published."""
    pass  # Silent for high-frequency publishing


def on_connect_fail(client, userdata):
    """Callback for connection failures."""
    print(f"❌ Cannot connect to SIoT server at {MQTT_HOST}:{MQTT_PORT}")


def create_mqtt_client():
    """Create and configure MQTT client."""
    client = mqtt.Client(client_id=CLIENT_ID, protocol=mqtt.MQTTv311)
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_publish = on_publish
    client.on_connect_fail = on_connect_fail
    client.reconnect_delay_set(min_delay=1, max_delay=10)
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

    payload_json = json.dumps(payload)
    topics = [HEART_RATE_TOPIC]

    # Mirror to the topic style used by the known-working SIoT example.
    if PUBLISH_LEGACY_TOPIC and LEGACY_HEARTBEAT_TOPIC:
        topics.append(LEGACY_HEARTBEAT_TOPIC)

    for topic in topics:
        if topic == LEGACY_HEARTBEAT_TOPIC:
            legacy_payload = {
                "msg": {
                    "bpm": bpm,
                    "status": payload["status"],
                },
                "from": DEVICE_ID,
                "time": payload["timestamp"],
            }
            message = json.dumps(legacy_payload)
        else:
            message = payload_json

        result = client.publish(topic, message, qos=1)

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"📤 Published to {topic}: {message}")
        else:
            print(f"❌ Failed to publish to {topic} (code: {result.rc})")


def main():
    """Main entry point."""
    print("=" * 60)
    print("UNIHIKER Heart Rate Publisher")
    print("=" * 60)
    print(f"Device ID: {DEVICE_ID}")
    print(f"MQTT Broker: {MQTT_HOST}:{MQTT_PORT}")
    print(f"Primary topic: {HEART_RATE_TOPIC}")
    if PUBLISH_LEGACY_TOPIC and LEGACY_HEARTBEAT_TOPIC:
        print(f"Legacy SIoT topic: {LEGACY_HEARTBEAT_TOPIC}")
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
