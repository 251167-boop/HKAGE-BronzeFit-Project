#!/usr/bin/env node
/**
 * MQTT Bridge for SilverFit
 * 
 * This bridge connects the SIoT MQTT broker (on UNIHIKER) to the web application.
 * It subscribes to MQTT topics and forwards messages to web clients via Server-Sent Events (SSE).
 * 
 * Architecture:
 *   UNIHIKER (MQTT) → Bridge (Node.js) → Web Clients (SSE)
 */

const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');

// Configuration from environment variables with defaults
const MQTT_HOST = process.env.MQTT_HOST || '192.168.123.1';
const MQTT_PORT = process.env.MQTT_PORT || '1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || 'siot';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'dfrobot';
const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'symbinest';
const BRIDGE_PORT = process.env.BRIDGE_PORT || '3001';
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || 'silverfit_mqtt_bridge';
const LEGACY_HEARTBEAT_TOPIC = process.env.MQTT_LEGACY_HEARTBEAT_TOPIC || 'HeartBeat/Beat';
const LEGACY_HEARTBEAT_TOPIC_FALLBACK =
  process.env.MQTT_LEGACY_HEARTBEAT_TOPIC_FALLBACK || 'Heartbeat/Beat';

// Topic definitions
const HEART_RATE_TOPIC = `${MQTT_TOPIC_PREFIX}/vital/heart`;
const SUBSCRIBED_TOPICS = [
  ...new Set([HEART_RATE_TOPIC, LEGACY_HEARTBEAT_TOPIC, LEGACY_HEARTBEAT_TOPIC_FALLBACK])
];

// TODO: Future topics for expansion
// const EMERGENCY_TOPIC = `${MQTT_TOPIC_PREFIX}/alert/emergency`;
// const POSTURE_TOPIC = `${MQTT_TOPIC_PREFIX}/alert/posture`;
// const WARNING_CMD_TOPIC = `${MQTT_TOPIC_PREFIX}/cmd/warning`;

// State
let latestHeartRate = null;
const clients = new Set();

function getNumericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function inferBpm(payload) {
  if (payload == null) return null;

  if (typeof payload === 'number' || typeof payload === 'string') {
    return getNumericValue(payload);
  }

  const candidates = [
    payload.bpm,
    payload.BPM,
    payload.beat,
    payload.Beat,
    payload.hr,
    payload.heartRate,
    payload.value
  ];

  for (const candidate of candidates) {
    const bpm = getNumericValue(candidate);
    if (bpm !== null) return bpm;
  }

  return null;
}

function normalizeHeartRateMessage(topic, payload) {
  if (topic === HEART_RATE_TOPIC) {
    const bpm = inferBpm(payload);
    if (bpm === null) return null;
    return {
      device: payload.device || payload.from || 'unihiker_01',
      bpm,
      status: payload.status || 'active',
      timestamp: Number(payload.timestamp || payload.time || Math.floor(Date.now() / 1000)),
      sourceTopic: topic,
      raw: payload
    };
  }

  if (topic === LEGACY_HEARTBEAT_TOPIC || topic === LEGACY_HEARTBEAT_TOPIC_FALLBACK) {
    const message = payload.msg ?? payload;
    const bpm = inferBpm(message);
    if (bpm === null) return null;
    return {
      device: payload.from || payload.device || 'unihiker_01',
      bpm,
      status: message.status || payload.status || 'active',
      timestamp: Number(payload.time || payload.timestamp || Math.floor(Date.now() / 1000)),
      sourceTopic: topic,
      raw: payload
    };
  }

  return null;
}

// Create Express app
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mqttConnected: mqttClient.connected,
    connectedClients: clients.size,
    latestHeartRate
  });
});

// REST API for latest heart rate
app.get('/api/heartrate', (req, res) => {
  res.json({
    ok: !!latestHeartRate,
    hr: latestHeartRate?.bpm || 0,
    data: latestHeartRate,
    timestamp: Date.now()
  });
});

// SSE endpoint for real-time updates
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const clientId = Date.now();
  clients.add(res);
  console.log(`✅ Client connected: ${clientId} (total: ${clients.size})`);
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
  
  // Send latest heart rate if available
  if (latestHeartRate) {
    res.write(`data: ${JSON.stringify({ type: 'heartrate', payload: latestHeartRate })}\n\n`);
  }
  
  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log(`❌ Client disconnected: ${clientId} (total: ${clients.size})`);
  });
});

// Create MQTT client
const mqttClient = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`, {
  clientId: MQTT_CLIENT_ID,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  protocolVersion: 4,
  keepalive: 60,
  reconnectPeriod: 5000,
  connectTimeout: 30000,
  resubscribe: true
});

// MQTT connection handlers
mqttClient.on('connect', () => {
  console.log(`✅ Connected to MQTT broker at ${MQTT_HOST}:${MQTT_PORT}`);
  
  // Subscribe to heart rate topics
  mqttClient.subscribe(SUBSCRIBED_TOPICS, (err) => {
    if (err) {
      console.error(`❌ Failed to subscribe to ${SUBSCRIBED_TOPICS.join(', ')}:`, err);
    } else {
      SUBSCRIBED_TOPICS.forEach((topic) => {
        console.log(`📡 Subscribed to topic: ${topic}`);
      });
    }
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const rawMessage = message.toString();
    let payload;

    try {
      payload = JSON.parse(rawMessage);
    } catch (parseError) {
      payload = rawMessage;
    }

    const normalized = normalizeHeartRateMessage(topic, payload);
    if (normalized) {
      latestHeartRate = normalized;
      console.log(`📊 Heart Rate: ${normalized.bpm} BPM (device: ${normalized.device}, topic: ${topic})`);

      // Broadcast to all connected SSE clients
      const data = JSON.stringify({ type: 'heartrate', payload: normalized });
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    } else {
      console.warn(`⚠️  Ignored MQTT payload without BPM on topic ${topic}`);
    }
  } catch (err) {
    console.error(`❌ Error processing MQTT message from ${topic}:`, err);
  }
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT error:', err);
});

mqttClient.on('disconnect', () => {
  console.log('⚠️  Disconnected from MQTT broker');
});

mqttClient.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT broker...');
});

// Start the bridge server
app.listen(BRIDGE_PORT, () => {
  console.log('='.repeat(60));
  console.log('SilverFit MQTT Bridge');
  console.log('='.repeat(60));
  console.log(`Bridge URL: http://localhost:${BRIDGE_PORT}`);
  console.log(`MQTT Broker: mqtt://${MQTT_HOST}:${MQTT_PORT}`);
  console.log(`Topics: ${SUBSCRIBED_TOPICS.join(', ')}`);
  console.log('='.repeat(60));
  console.log('Endpoints:');
  console.log(`  - GET http://localhost:${BRIDGE_PORT}/health`);
  console.log(`  - GET http://localhost:${BRIDGE_PORT}/api/heartrate`);
  console.log(`  - GET http://localhost:${BRIDGE_PORT}/events (SSE)`);
  console.log('='.repeat(60));
});
