import { NextResponse } from "next/server";

const NVIDIA_API_BASE_URL =
  process.env.NVIDIA_API_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

function buildFallbackReply(messages) {
  const latestUserMessage =
    messages
      ?.slice()
      .reverse()
      .find((message) => message?.role === "user")
      ?.content || "";

  return `I can help with BronzeFit exercise guidance, session summaries, and general wellness questions. I could not reach the live AI provider right now, so please try again in a moment.\n\nYour latest question was: "${latestUserMessage}"`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required." },
        { status: 400 }
      );
    }

    if (!NVIDIA_API_KEY) {
      return NextResponse.json({
        choices: [{ message: { content: buildFallbackReply(messages) } }],
        fallback: true,
      });
    }

    const response = await fetch(`${NVIDIA_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: body?.model || NVIDIA_MODEL,
        temperature: 0.4,
        max_tokens: 400,
        messages,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        choices: [{ message: { content: buildFallbackReply(messages) } }],
        fallback: true,
        error: `NVIDIA AI generation failed with ${response.status}.`,
        providerDetail: errorText,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      choices: [{ message: { content: buildFallbackReply([]) } }],
      fallback: true,
      error: error?.message || "Chat request failed.",
    });
  }
}
