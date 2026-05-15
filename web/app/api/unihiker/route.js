import { NextResponse } from "next/server";

const MQTT_BRIDGE_URL =
  process.env.MQTT_BRIDGE_URL ||
  process.env.NEXT_PUBLIC_MQTT_BRIDGE_URL ||
  "http://localhost:3001";

async function fetchBridgeJson(endpoint) {
  const response = await fetch(`${MQTT_BRIDGE_URL}${endpoint}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000)
  });
  if (!response.ok) {
    throw new Error(`Bridge returned ${response.status}`);
  }
  return response.json();
}

export async function GET(request) {
  const ping = new URL(request.url).searchParams.get("ping");

  try {
    if (ping) {
      const bridgeHealth = await fetchBridgeJson("/health");
      return NextResponse.json({
        ok: !!bridgeHealth?.mqttConnected,
        message: bridgeHealth?.mqttConnected ? "Unihiker connected." : "MQTT bridge connected, waiting for broker."
      });
    }

    const data = await fetchBridgeJson("/api/heartrate");
    const hr = Number(data?.hr ?? data?.data?.bpm ?? 0);

    return NextResponse.json({
      ok: !!data?.ok && hr > 0,
      hr: hr > 0 ? hr : 0,
      message: data?.ok ? "Heart rate fetched." : "Waiting for heart rate data.",
      source: "mqtt-bridge",
      data: data?.data ?? null
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        hr: 0,
        message: ping ? "MQTT bridge not reachable." : "Unable to fetch heart rate from MQTT bridge.",
        source: "mqtt-bridge"
      },
      { status: 200 }
    );
  }
}
