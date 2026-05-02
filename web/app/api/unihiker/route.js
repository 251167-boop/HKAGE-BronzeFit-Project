import { NextResponse } from "next/server";

const UNIHIKER_URL = process.env.UNIHIKER_URL || "http://10.1.2.3:5000/hr";

export async function GET(request) {
  const ping = new URL(request.url).searchParams.get("ping");
  try {
    const res = await fetch(UNIHIKER_URL, { cache: "no-store" });
    const contentType = res.headers.get("content-type") || "";
    let hr = null;

    if (contentType.includes("application/json")) {
      const payload = await res.json();
      hr = Number(payload.hr ?? payload.bpm ?? 0);
    } else {
      hr = Number((await res.text()).trim());
    }

    if (ping) {
      return NextResponse.json({ ok: res.ok, message: res.ok ? "Unihiker connected." : "Unihiker not healthy." });
    }
    return NextResponse.json({
      ok: res.ok && hr > 0,
      hr: hr > 0 ? hr : 0,
      message: res.ok ? "Heart rate fetched." : "Unihiker request failed."
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        hr: 0,
        message: ping ? "Unihiker not reachable." : "Unable to fetch heart rate."
      },
      { status: 200 }
    );
  }
}
