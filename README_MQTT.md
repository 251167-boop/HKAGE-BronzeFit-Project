# UNIHIKER + SIoT MQTT Implementation

## Quick Start

### 1. Start the MQTT Bridge
```bash
cd /Users/quinton/Documents/trae_projects/HKAGE
node mqtt-bridge.js
```

### 2. Run the UNIHIKER Python Publisher
On the UNIHIKER device:
```bash
python unihiker_publish_vitals.py
```

### 3. Start the Web Application
```bash
cd /Users/quinton/Documents/trae_projects/HKAGE/web
npm run dev
```

### 4. Access the Exercise Session
Navigate to `http://localhost:3000/session` and start an exercise to see live UNIHIKER data.

## MQTT Topic
- **symbinest/vital/heart** - Heart rate data (implemented)

## TODOs for Future
- Real sensor integration (replace fake BPM)
- Emergency button on UNIHIKER
- Fall detection via accelerometer
- Database logging
- Family notifications (email/SMS)
