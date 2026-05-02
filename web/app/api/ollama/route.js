import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function GET() {
  try {
    const res = await fetch(OLLAMA_BASE_URL, { cache: "no-store" });
    return NextResponse.json({
      ok: res.ok,
      message: res.ok ? "Ollama reachable." : `Ollama status ${res.status}.`
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Ollama not reachable." },
      { status: 200 }
    );
  }
}
