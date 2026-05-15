# UNIHIKER + SIoT MQTT Implementation Summary

## Overview
This document summarizes the implementation of a proof-of-concept MQTT data flow for the SilverFit elderly fitness app, connecting UNIHIKER hardware to the web application via SIoT MQTT broker.

## Data Flow

```
UNIHIKER Python Script (unihiker_publish_vitals.py)
    ↓
SIoT MQTT Broker (on UNIHIKER at 10.1.2.3:1883)
    ↓
Node.js MQTT Bridge (mqtt-bridge.js on localhost:3001)
    ↓
Exercise Session Page UI (web/app/session/page.js)
```

## Files Changed

### 1. `unihiker_publish_vitals.py` (NEW)
- Python script that runs on UNIHIKER hardware
- Publishes fake heart-rate data (70-90 BPM normally, occasionally 125-145 for testing)
- Publishes to topic `symbinest/vital/heart` every 2 seconds
- Uses `paho-mqtt` library
- Configurable via environment variables

### 2. `mqtt-bridge.js` (NEW)
- Node.js bridge server that subscribes to MQTT broker
- Forwards MQTT messages to web clients via Server-Sent Events (SSE)
- Provides endpoints:
  - `GET /health` - Health check
  - `GET /api/heartrate` - Latest heart rate (polling)
  - `GET /events` - SSE stream for real-time updates
- Runs on port 3001 by default

### 3. `web/app/api/mqtt/route.js` (NEW)
- Next.js API route for proxying MQTT bridge requests
- Provides CORS headers for browser access
- Supports health check and heart rate endpoints

### 4. `web/app/session/page.js` (MODIFIED)
Added MQTT integration:
- New state: `unihikerStatus`, `unihikerData`, `showHighBpmWarning`
- SSE connection to MQTT bridge at `${NEXT_PUBLIC_MQTT_BRIDGE_URL}/events`
- Displays live BPM in the data overlay
- Shows UNIHIKER connection status (waiting, connected, disconnected)
- High BPM (>120) warning overlay with dismiss button

### 5. `web/app/session/session.css` (MODIFIED)
Added styles for:
- High BPM warning overlay (red background, white card)
- UNIHIKER status indicators (waiting: amber, connected: green, disconnected: red)
- Warning dismiss button

### 6. `web/.env.example` (MODIFIED)
Added environment variables:
- `NEXT_PUBLIC_MQTT_BRIDGE_URL=http://localhost:3001`
- `MQTT_HOST=10.1.2.3`
- `MQTT_PORT=1883`
- `MQTT_USERNAME=siot`
- `MQTT_PASSWORD=dfrobot`
- `MQTT_TOPIC_PREFIX=symbinest`

## How to Run

### 1. Start the MQTT Bridge
```bash
cd /Users/quinton/Documents/trae_projects/HKAGE
node mqtt-bridge.js
```
The bridge will start on port 3001 and connect to the MQTT broker at 10.1.2.3:1883.

### 2. Run the UNIHIKER Python Publisher
On the UNIHIKER device:
```bash
python unihiker_publish_vitals.py
```
This will start publishing fake BPM data every 2 seconds.

### 3. Start the Web Application
```bash
cd /Users/quinton/Documents/trae_projects/HKAGE/web
npm run dev
```

### 4. Access the Exercise Session Page
Navigate to `http://localhost:3000/session` and start an exercise to see the live UNIHIKER data.

## MQTT Topic Structure

### Topics Used
- `symbinest/vital/heart` - Heart rate data (implemented)

### TODO Topics (for future implementation)
- `symbinest/alert/emergency` - Emergency alerts
- `symbinest/alert/posture` - Posture warnings
- `symbinest/cmd/warning` - Warning commands to UNIHIKER

## JSON Payload Format

```json
{
  "device": "unihiker_01",
  "bpm": 74,
  "status": "active",
  "timestamp": 1715248800
}
```

## Verification Steps

### 1. Verify Data in SIoT Web Interface
1. Open browser and navigate to `http://10.1.2.3:8080` (or the UNIHIKER Wi-Fi IP)
2. Login with SIoT credentials
3. Navigate to the MQTT topics section
4. Verify that messages are appearing on `symbinest/vital/heart`

### 2. Verify MQTT Bridge is Receiving Data
1. Check the bridge console output
2. You should see logs like:
   ```
   📡 Received message on topic: symbinest/vital/heart
   📊 Heart Rate: 74 BPM
   ```

### 3. Verify BPM in Exercise Session Page
1. Navigate to `http://localhost:3000/session`
2. Start an exercise
3. Look for:
   - "Waiting..." message initially
   - "UNIHIKER" with green status when connected
   - Live BPM value updating every 2 seconds
   - High BPM warning overlay if BPM > 120

## TODOs for Future Implementation

### Real Sensor Integration
- Replace fake BPM generation with actual heart rate sensor readings
- Integrate with UNIHIKER GPIO pins or Bluetooth HRM

### Emergency Button
- Implement physical emergency button on UNIHIKER
- Publish to `symbinest/alert/emergency` topic
- Trigger immediate notification workflow

### Fall Detection
- Integrate UNIHIKER accelerometer for fall detection
- Publish fall events to `symbinest/alert/emergency`
- Auto-pause exercise session on fall detection

### Database Logging
- Persist heart rate history to database
- Create session analytics dashboard
- Enable trend analysis for caregivers

### Bidirectional Commands
- Implement warning commands from web to UNIHIKER
- Audio alerts on UNIHIKER for high BPM
- Haptic feedback integration

### Family Notifications
- Email/SMS integration for emergency alerts
- Real-time family dashboard updates
- Push notification support

## Troubleshooting

### MQTT Bridge Connection Failed
- Verify UNIHIKER is connected and powered on
- Check that SIoT is running on port 1883
- Verify firewall settings allow MQTT traffic
- Check `MQTT_HOST` environment variable

### No Data in Exercise Session
- Verify bridge is running on port 3001
- Check browser console for SSE connection errors
- Verify `NEXT_PUBLIC_MQTT_BRIDGE_URL` is set correctly
- Check for CORS errors in browser console

### SIoT Web Interface Not Accessible
- Verify UNIHIKER IP address (try 10.1.2.3 for USB, or Wi-Fi IP)
- Check SIoT is running: `systemctl status siot` on UNIHIKER
- Verify port 8080 is not blocked by firewall

## Notes

- This is a proof-of-concept implementation using fake BPM data
- All components run locally for development and testing
- The architecture supports easy migration to real sensors
- MQTT topic structure allows for future expansion (emergency, posture, commands)
