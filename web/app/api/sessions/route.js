import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "sessions.json");

async function readSessions() {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function writeSessions(sessions) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(sessions, null, 2), "utf8");
}

export async function GET() {
  const sessions = await readSessions();
  return NextResponse.json({
    ok: true,
    count: sessions.length,
    latest: sessions[0] || null,
    sessions
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const sessions = await readSessions();
    const entry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      exercise: String(body?.exercise || ""),
      avgHeartRate: Number(body?.avgHeartRate || 0),
      peakHeartRate: Number(body?.peakHeartRate || 0),
      wrongMoves: Number(body?.wrongMoves || 0),
      durationSec: Number(body?.durationSec || 0),
      score: Number(body?.score || 0),
      scoreCategory: String(body?.scoreCategory || ""),
      scoreBreakdown: body?.scoreBreakdown || null,
      completionPercent: Number(body?.completionPercent || 0),
      movementAccuracyPercent: Number(body?.movementAccuracyPercent || 0),
      weeklyExerciseDays: Number(body?.weeklyExerciseDays || 0),
      recoveryMinutes:
        body?.recoveryMinutes === null || body?.recoveryMinutes === undefined
          ? null
          : Number(body.recoveryMinutes),
      calories: Number(body?.calories || 0),
      currentRep: Number(body?.currentRep || 0),
      report: String(body?.report || "")
    };

    const next = [entry, ...sessions].slice(0, 200);
    await writeSessions(next);
    return NextResponse.json({ ok: true, session: entry });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Failed to save session." },
      { status: 500 }
    );
  }
}
