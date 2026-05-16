/**
 * MQTT Bridge API Route for SilverFit AI
 * 
 * This API route acts as a proxy to the MQTT bridge server,
 * allowing the frontend to fetch heart rate data via HTTP polling.
 * 
 * Endpoints:
 *   GET /api/mqtt/health - Health check
 *   GET /api/mqtt/heartrate - Get current heart rate
 * 
 * Environment variables:
 *   MQTT_BRIDGE_URL - URL of the MQTT bridge server (default: http://localhost:3001)
 */

const MQTT_BRIDGE_URL = process.env.MQTT_BRIDGE_URL || 'http://localhost:3001';

async function fetchFromBridge(endpoint) {
  try {
    const response = await fetch(`${MQTT_BRIDGE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Bridge returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`MQTT bridge error (${endpoint}):`, error.message);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'health';

  // Validate endpoint
  const validEndpoints = ['/health', '/api/heartrate'];
  const targetEndpoint = validEndpoints.find(e => endpoint === e.replace('/', '')) || '/health';

  const data = await fetchFromBridge(targetEndpoint);

  if (data === null) {
    return Response.json(
      { 
        error: 'MQTT bridge unavailable',
        connected: false,
        data: null
      },
      { status: 503 }
    );
  }

  return Response.json(data);
}

// SSE endpoint for real-time updates
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'sse') {
    // Return SSE connection info
    return Response.json({
      sseUrl: `${MQTT_BRIDGE_URL}/events`,
      connected: true
    });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
