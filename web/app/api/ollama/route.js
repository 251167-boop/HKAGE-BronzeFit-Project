import { NextResponse } from "next/server";

const NVIDIA_API_BASE_URL =
  process.env.NVIDIA_API_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

function buildLocalFallbackReport(summary) {
  const score = Number(summary.score ?? 0);
  const avgHeartRate = Number(summary.avgHeartRate ?? 0);
  const wrongMoves = Number(summary.wrongMoves ?? 0);
  const durationSec = Number(summary.durationSec ?? 0);
  const currentRep = Number(summary.currentRep ?? 0);
  const scoreCategory = summary.scoreCategory || "Needs Improvement";
  const completionPercent = Number(summary.completionPercent ?? 0);
  const movementAccuracyPercent = Number(summary.movementAccuracyPercent ?? 0);

  const encouragement =
    score >= 75
      ? "You did very well today and kept a strong, steady effort."
      : score >= 60
        ? "Good work today. Your session shows steady progress."
        : "Well done for completing the session. Consistency matters most.";

  const improvement =
    wrongMoves <= 1
      ? "Keep maintaining the same posture quality and controlled pace."
      : "Focus on matching the reference pose more closely and moving with slower control.";

  const safety =
    avgHeartRate > 0
      ? `Your average heart rate was ${avgHeartRate} bpm. Stay within your comfortable range and pause if you feel dizzy or tired.`
      : "Heart-rate data was limited, so continue exercising carefully and stop if you feel discomfort.";

  return [
    "1) Encouragement",
    encouragement,
    "",
    "2) What to improve next session",
    `${improvement} Completed reps: ${currentRep}. Session length: ${durationSec} seconds.`,
    "",
    "3) Safety note",
    safety,
    "",
    "4) Health score",
    `${Math.max(0, Math.min(100, score))}/100 (${scoreCategory})`,
    "",
    "5) Completion and form",
    `Completion: ${completionPercent}%. Correct form: ${movementAccuracyPercent}%.`
  ].join("\n");
}

export async function GET() {
  if (!NVIDIA_API_KEY) {
    return NextResponse.json({
      ok: false,
      message: "NVIDIA API key is missing."
    });
  }

  try {
    const res = await fetch(`${NVIDIA_API_BASE_URL}/models`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`
      }
    });
    return NextResponse.json({
      ok: res.ok,
      message: res.ok ? "NVIDIA AI reachable." : `NVIDIA AI status ${res.status}.`
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "NVIDIA AI not reachable." },
      { status: 200 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const summary = body?.summary || {};
    const prompt =
      body?.prompt ||
      `You are a senior-friendly fitness coach.
Return a concise report with sections:
1) Encouragement
2) What to improve next session
3) Safety note
4) Health score out of 100 with rating category
5) Completion and form overview

Workout summary:
- exercise: ${summary.exercise ?? "General exercise"}
- avgHeartRate: ${summary.avgHeartRate ?? 0}
- peakHeartRate: ${summary.peakHeartRate ?? 0}
- wrongMoves: ${summary.wrongMoves ?? 0}
- durationSec: ${summary.durationSec ?? 0}
- score: ${summary.score ?? 0}
- currentRep: ${summary.currentRep ?? 0}
- scoreCategory: ${summary.scoreCategory ?? "Needs Improvement"}
- completionPercent: ${summary.completionPercent ?? 0}
- movementAccuracyPercent: ${summary.movementAccuracyPercent ?? 0}
- weeklyExerciseDays: ${summary.weeklyExerciseDays ?? 0}
- recoveryMinutes: ${summary.recoveryMinutes ?? "n/a"}
`;

    if (!NVIDIA_API_KEY) {
      throw new Error("Missing NVIDIA API key.");
    }

    const res = await fetch(`${NVIDIA_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: body?.model || NVIDIA_MODEL,
        temperature: 0.4,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "You are a gentle elderly fitness coach. Be concise, encouraging, and practical."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      cache: "no-store"
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        {
          ok: false,
          message: `NVIDIA AI generation failed with ${res.status}.`,
          providerDetail: errorText,
          fallback: true,
          report: buildLocalFallbackReport(summary)
        },
        { status: 200 }
      );
    }

    const data = await res.json();
    const report =
      data?.choices?.[0]?.message?.content ||
      "Session complete. Keep moving safely and consistently.";

    return NextResponse.json({
      ok: true,
      report
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        fallback: true,
        message: error?.message || "NVIDIA AI request failed.",
        report: buildLocalFallbackReport({})
      },
      { status: 200 }
    );
  }
}
