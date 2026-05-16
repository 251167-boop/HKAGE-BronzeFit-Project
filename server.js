import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mqtt from 'mqtt';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- MQTT Setup for Real BPM ---
let currentBpm = null;

const SIOT_SERVER = "192.168.123.1";
const SIOT_PORT = 1883;
const SIOT_USER = "siot";
const SIOT_PASS = "dfrobot";
const CLIENT_ID = "receiver_client_node_" + Math.random().toString(16).substring(2, 10);
const TOPIC = "HeartBeat/Beat";

const mqttClient = mqtt.connect(`mqtt://${SIOT_SERVER}:${SIOT_PORT}`, {
  username: SIOT_USER,
  password: SIOT_PASS,
  clientId: CLIENT_ID,
  protocolVersion: 4 // MQTTv3.1.1
});

mqttClient.on('connect', () => {
  console.log('[INFO] Connected to SIoT successfully!');
  mqttClient.subscribe(TOPIC, (err) => {
    if (!err) {
      console.log(`[INFO] Subscribed to: ${TOPIC}`);
    } else {
      console.error(`[ERROR] Subscription failed:`, err);
    }
  });
});

mqttClient.on('message', (topic, message) => {
  if (topic === TOPIC) {
    const payload = message.toString();
    // console.log(`[MESSAGE] Topic: ${topic} | Data: ${payload}`);
    const parsed = parseInt(payload, 10);
    if (!isNaN(parsed)) {
      currentBpm = parsed;
    }
  }
});

mqttClient.on('error', (err) => {
  console.error('[ERROR] MQTT Connection error:', err.message);
});

// Endpoint to get the latest real BPM
app.get('/api/bpm', (req, res) => {
  res.json({ bpm: currentBpm });
});
// -------------------------------

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    
    // Ensure the model is one of the allowed ones
    const allowedModels = [
      'moonshotai/kimi-k2.6',
      'deepseek-ai/deepseek-v4-pro',
      'z-ai/glm-5.1',
      'minimaxai/minimax-m2.7'
    ];
    
    const selectedModel = allowedModels.includes(model) ? model : allowedModels[0];

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('NVIDIA API Error:', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch from NVIDIA API' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
