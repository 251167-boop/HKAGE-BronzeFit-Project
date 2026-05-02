import { NextResponse } from "next/server";
import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || "";
const FAMILY_PHONE_NUMBER = process.env.FAMILY_PHONE_NUMBER || "";

export async function POST(request) {
  try {
    const body = await request.json();
    const messageText =
      body?.message ||
      "SilverFit Emergency: Heart rate stayed out of safe range. Please check immediately.";

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !FAMILY_PHONE_NUMBER) {
      return NextResponse.json({
        ok: false,
        message: "Twilio environment variables are not configured."
      });
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      body: messageText,
      from: TWILIO_FROM_NUMBER,
      to: FAMILY_PHONE_NUMBER
    });

    return NextResponse.json({ ok: true, sid: message.sid, message: "Emergency SMS sent." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Failed to send emergency SMS." },
      { status: 500 }
    );
  }
}
